"""Builds the hybrid food image dataset from open sources, labelled with foods.ts ids.

    py -3 ml/build_dataset.py                 # all sources, default caps
    py -3 ml/build_dataset.py --only turkishfoods25 --train-cap 50

Images land in ml/data/images/<food_id>/<source>-<split>-<n>.jpg (longest side 384 px) and every
row is listed in ml/data/manifest.csv with its source, original class, split and license, so
any source can be dropped or re-weighted later. Sources are streamed from Hugging Face; nothing
but the kept images is written to disk (the HF cache still holds the downloaded shards).
"""

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

import numpy as np
from datasets import load_dataset
from PIL import Image

ROOT = Path(__file__).parent
DATA = ROOT / "data"
MAX_SIDE = 384

# FoodSeg103 mask values -> ingredient names (from the dataset card; 0 is background).
FOODSEG_CLASSES = [
    "background", "candy", "egg tart", "french fries", "chocolate", "biscuit", "popcorn", "pudding", "ice cream",
    "cheese butter", "cake", "wine", "milkshake", "coffee", "juice", "milk", "tea", "almond", "red beans", "cashew",
    "dried cranberries", "soy", "walnut", "peanut", "egg", "apple", "date", "apricot", "avocado", "banana",
    "strawberry", "cherry", "blueberry", "raspberry", "mango", "olives", "peach", "lemon", "pear", "fig",
    "pineapple", "grape", "kiwi", "melon", "orange", "watermelon", "steak", "pork", "chicken duck", "sausage",
    "fried meat", "lamb", "sauce", "crab", "fish", "shellfish", "shrimp", "soup", "bread", "corn", "hamburg",
    "pizza", "hanamaki baozi", "wonton dumplings", "pasta", "noodles", "rice", "pie", "tofu", "eggplant", "potato",
    "garlic", "cauliflower", "tomato", "kelp", "seaweed", "spring onion", "rape", "ginger", "okra", "lettuce",
    "pumpkin", "cucumber", "white radish", "carrot", "asparagus", "bamboo shoots", "broccoli", "celery stick",
    "cilantro mint", "snow peas", "cabbage", "bean sprouts", "onion", "pepper", "green beans", "French beans",
    "king oyster mushroom", "shiitake", "enoki mushroom", "oyster mushroom", "white button mushroom", "salad",
    "other ingredients",
]

# Which HF split feeds which of our splits. Official test/validation splits stay test-only so
# results are comparable with the papers and no source leaks into its own evaluation.
SPLITS = {
    "turkishfoods25": {"train": "train", "eval": "train", "test": "test"},
    "food101": {"train": "train", "validation": "test"},
    "foodseg103": {"train": "train", "validation": "test"},
}

# An ingredient region becomes a crop only if it is big and solid enough to be recognisable alone.
CROP_MIN_AREA = 0.04  # share of the whole image
CROP_MIN_SIDE = 64  # px, before resizing
CROP_MIN_FILL = 0.3  # mask pixels / bounding-box pixels (rejects scattered bits)
CROP_PAD = 0.1


def shrink(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    return img


def ingredient_crops(image: Image.Image, mask: Image.Image, wanted: dict[int, str]):
    """Yields (class_id, crop) for each wanted ingredient that fills a solid, large region."""
    m = np.array(mask)
    if m.ndim == 3:
        m = m[..., 0]
    h, w = m.shape
    for cid in np.unique(m):
        if int(cid) not in wanted:
            continue
        ys, xs = np.nonzero(m == cid)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        box_area = (y1 - y0) * (x1 - x0)
        if len(ys) < CROP_MIN_AREA * h * w or min(y1 - y0, x1 - x0) < CROP_MIN_SIDE or len(ys) < CROP_MIN_FILL * box_area:
            continue
        py, px = int((y1 - y0) * CROP_PAD), int((x1 - x0) * CROP_PAD)
        box = (max(0, x0 - px), max(0, y0 - py), min(w, x1 + px), min(h, y1 + py))
        yield int(cid), image.crop(box)


def build_source(name: str, spec: dict, caps: dict[str, int], writer, counts: Counter):
    mapping: dict[str, str] = spec["map"]
    for hf_split, split in SPLITS[name].items():
        ds = load_dataset(spec["hf"], split=hf_split, streaming=True)
        if spec["kind"] == "dish":
            names = ds.features["label"].names
            keep = {i: mapping[n] for i, n in enumerate(names) if n in mapping}
        else:
            keep = {i: mapping[n] for i, n in enumerate(FOODSEG_CLASSES) if n in mapping}
        # Caps are per (food, source, split) so one big source can't drown a small one.
        full = lambda food: counts[(food, name, split)] >= caps[split]  # noqa: E731
        seen = 0
        for row in ds:
            seen += 1
            if spec["kind"] == "dish":
                label = row["label"]
                if label not in keep or full(keep[label]):
                    continue
                items = [(label, row["image"])]
            else:
                present = {c: keep[c] for c in row.get("classes_on_image", []) if c in keep and not full(keep[c])}
                if not present:
                    continue
                items = list(ingredient_crops(row["image"].convert("RGB"), row["label"], present))
            for label, img in items:
                food = keep[label]
                if full(food):
                    continue
                n = counts[(food, name, split)]
                path = DATA / "images" / food / f"{name}-{split}-{n:04d}.jpg"
                path.parent.mkdir(parents=True, exist_ok=True)
                shrink(img).save(path, quality=90)
                counts[(food, name, split)] += 1
                source_class = names[label] if spec["kind"] == "dish" else FOODSEG_CLASSES[label]
                writer.writerow([path.relative_to(DATA).as_posix(), food, name, source_class, split, spec["license"]])
            if all(full(f) for f in set(keep.values())):
                break
        print(f"  {name}/{hf_split}: scanned {seen} rows")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="build just this source")
    parser.add_argument("--train-cap", type=int, default=300)
    parser.add_argument("--test-cap", type=int, default=80)
    args = parser.parse_args()

    sources = json.loads((ROOT / "label_map.json").read_text(encoding="utf-8"))["sources"]
    if args.only:
        sources = {args.only: sources[args.only]}
    caps = {"train": args.train_cap, "test": args.test_cap}

    DATA.mkdir(exist_ok=True)
    manifest = DATA / "manifest.csv"
    # Rebuilding one source keeps the other sources' rows.
    old = []
    if manifest.exists() and args.only:
        with manifest.open(encoding="utf-8", newline="") as f:
            old = [r for r in csv.reader(f)][1:]
        old = [r for r in old if r[2] != args.only]
    counts: Counter = Counter()
    with manifest.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["path", "food_id", "source", "source_class", "split", "license"])
        writer.writerows(old)
        for name, spec in sources.items():
            print(f"{name} ({spec['hf']})")
            build_source(name, spec, caps, writer, counts)

    per_food = Counter()
    for (food, _, split), n in counts.items():
        per_food[(food, split)] += n
    foods = sorted({f for f, _ in per_food})
    print(f"\n{len(foods)} foods, {sum(counts.values())} new images")
    for food in foods:
        print(f"  {food:14} train {per_food[(food, 'train')]:4}  test {per_food[(food, 'test')]:4}")


if __name__ == "__main__":
    main()
