"""Trains and evaluates the food classifier on the hybrid dataset (see build_dataset.py).

    py -3 ml/train.py
    py -3 ml/train.py --model openai/clip-vit-base-patch32

A frozen CLIP image encoder turns each photo into an embedding; a logistic regression on top
learns our foods (a "linear probe", fast enough for a CPU). CLIP's text encoder also gives a
zero-shot classifier for every food in foods.ts, including the ones with no photos yet, so the
two are compared on the same test images. Embeddings are cached per model in ml/data.

Writes ml/models/food-probe.json (weights + zero-shot text embeddings) and
ml/reports/<model>.json (per-class and per-source scores, confusions).
"""

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sklearn.linear_model import LogisticRegression
from transformers import CLIPModel, CLIPProcessor

ROOT = Path(__file__).parent
DATA = ROOT / "data"
BATCH = 32
# What else a region of a meal photo can be. The app splits a plate into regions and drops the ones
# that look more like these than like food.
BACKGROUND_PROMPTS = {
    "plate": "an empty white plate", "bowl": "an empty bowl", "table": "a wooden table", "tablecloth": "a tablecloth",
    "tray": "a food tray", "napkin": "a paper napkin", "cutlery": "a fork, knife or spoon", "glass": "a drinking glass",
    "cup": "a cup", "bottle": "a bottle", "hand": "a person's hand", "phone": "a phone screen",
    "packaging": "food packaging", "box": "a takeaway box", "board": "a cutting board",
}


def load_manifest():
    with (DATA / "manifest.csv").open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


@torch.no_grad()
def embed_images(model, processor, paths: list[str], cache: Path) -> np.ndarray:
    """L2-normalised image embeddings, cached by path so re-runs only embed new images."""
    known = {}
    if cache.exists():
        z = np.load(cache, allow_pickle=False)
        known = dict(zip(z["paths"].tolist(), z["emb"]))
    todo = [p for p in paths if p not in known]
    for i in range(0, len(todo), BATCH):
        chunk = todo[i : i + BATCH]
        images = [Image.open(DATA / p).convert("RGB") for p in chunk]
        out = model.get_image_features(**processor(images=images, return_tensors="pt"))
        out = out.pooler_output if hasattr(out, "pooler_output") else out
        out = torch.nn.functional.normalize(out, dim=-1).numpy()
        known.update(zip(chunk, out))
        print(f"  embedded {min(i + BATCH, len(todo))}/{len(todo)}", end="\r")
    if todo:
        print()
        np.savez(cache, paths=np.array(list(known)), emb=np.stack(list(known.values())))
    return np.stack([known[p] for p in paths])


@torch.no_grad()
def embed_texts(model, processor, prompts: dict[str, str]) -> tuple[list[str], np.ndarray]:
    ids = list(prompts)
    texts = [prompts[i] if i.startswith("bg:") else f"a photo of {prompts[i]}, a type of food." for i in ids]
    out = model.get_text_features(**processor(text=texts, return_tensors="pt", padding=True))
    out = out.pooler_output if hasattr(out, "pooler_output") else out
    return ids, torch.nn.functional.normalize(out, dim=-1).numpy()


def topk_hits(scores: np.ndarray, classes: list[str], truth: list[str], k: int) -> np.ndarray:
    top = np.argsort(-scores, axis=1)[:, :k]
    idx = {c: i for i, c in enumerate(classes)}
    return np.array([idx.get(t, -1) in row for t, row in zip(truth, top)])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="openai/clip-vit-base-patch16")
    parser.add_argument("--C", type=float, default=2.0, help="inverse regularisation of the probe")
    args = parser.parse_args()

    rows = load_manifest()
    prompts = {k: v for k, v in json.loads((ROOT / "food_prompts.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}
    unknown = {r["food_id"] for r in rows} - set(prompts)
    assert not unknown, f"foods missing from food_prompts.json: {unknown}"

    print(f"Loading {args.model}")
    torch.set_num_threads(max(1, torch.get_num_threads()))
    model = CLIPModel.from_pretrained(args.model).eval()
    processor = CLIPProcessor.from_pretrained(args.model)

    slug = args.model.split("/")[-1]
    emb = embed_images(model, processor, [r["path"] for r in rows], DATA / f"emb-{slug}.npz")
    text_ids, text_emb = embed_texts(model, processor, prompts)
    bg_ids, bg_emb = embed_texts(model, processor, {f"bg:{k}": f"a photo of {v}." for k, v in BACKGROUND_PROMPTS.items()})

    train = np.array([r["split"] == "train" for r in rows])
    y = np.array([r["food_id"] for r in rows])
    src = np.array([r["source"] for r in rows])

    probe = LogisticRegression(C=args.C, max_iter=3000, class_weight="balanced")
    probe.fit(emb[train], y[train])
    classes = probe.classes_.tolist()

    test = ~train
    truth = y[test].tolist()
    probe_scores = probe.decision_function(emb[test])
    zs_scores = emb[test] @ text_emb.T  # over all 79 foods, as the app would face it
    # Zero-shot restricted to the trained foods, to compare like with like.
    zs_cols = [text_ids.index(c) for c in classes]
    zs_covered = zs_scores[:, zs_cols]

    results = {
        "probe": {k: topk_hits(probe_scores, classes, truth, k) for k in (1, 3)},
        "zeroshot_covered": {k: topk_hits(zs_covered, classes, truth, k) for k in (1, 3)},
        "zeroshot_all79": {k: topk_hits(zs_scores, text_ids, truth, k) for k in (1, 3)},
    }
    print(f"\nTest images: {len(truth)} across {len(classes)} foods ({train.sum()} train)")
    print(f"{'method':18} {'top-1':>7} {'top-3':>7}")
    for name, hits in results.items():
        print(f"{name:18} {hits[1].mean():7.1%} {hits[3].mean():7.1%}")

    pred = np.array(classes)[probe_scores.argmax(1)]
    by_source = {}
    for s in sorted(set(src[test])):
        m = src[test] == s
        by_source[s] = {"n": int(m.sum()), "probe_top1": float(results["probe"][1][m].mean()), "zeroshot_covered_top1": float(results["zeroshot_covered"][1][m].mean())}
    print("\nProbe top-1 by source:")
    for s, v in by_source.items():
        print(f"  {s:15} {v['probe_top1']:6.1%}  (n={v['n']}, zero-shot {v['zeroshot_covered_top1']:.1%})")

    per_class = {}
    for c in classes:
        m = np.array(truth) == c
        if m.any():
            per_class[c] = {"n": int(m.sum()), "probe_top1": float((pred[m] == c).mean())}
    print("\nWeakest foods (probe top-1):")
    for c, v in sorted(per_class.items(), key=lambda kv: kv[1]["probe_top1"])[:8]:
        print(f"  {c:14} {v['probe_top1']:6.1%}  (n={v['n']})")
    confusions = Counter((t, p) for t, p in zip(truth, pred) if t != p).most_common(10)
    print("\nTop confusions (truth -> predicted):")
    for (t, p), n in confusions:
        print(f"  {t} -> {p}: {n}")

    missing = sorted(set(prompts) - set(classes))
    print(f"\nFoods with no photos yet ({len(missing)}): zero-shot only")

    (ROOT / "models").mkdir(exist_ok=True)
    (ROOT / "models" / "food-probe.json").write_text(json.dumps({
        "model": args.model,
        "classes": classes,
        "coef": np.round(probe.coef_, 5).tolist(),
        "intercept": np.round(probe.intercept_, 5).tolist(),
        "zeroshot": {"ids": text_ids, "text_emb": np.round(text_emb, 5).tolist()},
        "background": {"ids": [i.removeprefix("bg:") for i in bg_ids], "text_emb": np.round(bg_emb, 5).tolist()},
    }), encoding="utf-8")
    (ROOT / "reports").mkdir(exist_ok=True)
    (ROOT / "reports" / f"{slug}.json").write_text(json.dumps({
        "model": args.model,
        "n_train": int(train.sum()),
        "n_test": len(truth),
        "scores": {name: {f"top{k}": float(h.mean()) for k, h in hits.items()} for name, hits in results.items()},
        "by_source": by_source,
        "per_class": per_class,
        "confusions": [{"truth": t, "pred": p, "n": n} for (t, p), n in confusions],
        "foods_without_photos": missing,
        "train_counts": dict(Counter(y[train].tolist())),
    }, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
