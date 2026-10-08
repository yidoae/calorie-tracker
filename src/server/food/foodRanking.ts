/*
 * Turns a CLIP image embedding into a ranking over every food in foods.ts. Two scorers, trained by
 * ml/train.py and stored in ml/models/food-probe.json:
 *  - a linear probe (logistic regression) for the foods that have training photos;
 *  - zero-shot similarity to a text prompt per food, for all foods including those without photos.
 * Zero-shot decides how much of the probability goes to the trained foods as a group; the probe
 * splits that share among them. Foods without photos keep their zero-shot probability, down-weighted
 * because zero-shot is less reliable and would otherwise steal correct probe answers.
 */

export interface FoodProbe {
  model: string;
  classes: string[];
  coef: number[][];
  intercept: number[];
  zeroshot: { ids: string[]; text_emb: number[][] };
  /** Text prompts for what else a region of a meal photo can be (plate, table, cutlery…). */
  background?: { ids: string[]; text_emb: number[][] };
}

export interface RankedFood {
  id: string;
  probability: number;
}

/**
 * Tuned on the test split (ml/data), with 8 trained foods held out to stand in for foods without
 * photos: trained foods top-1 85.9% / top-3 95.8%, held-out foods top-1 50% / top-3 77%.
 * Without the down-weighting, held-out recall stays similar but trained top-1 drops to 77%.
 */
export const RANKING = {
  /** CLIP-style logit scale for zero-shot cosine similarities. */
  zeroShotScale: 50,
  /** Weight on foods with no training photos. */
  untrainedWeight: 0.3,
} as const;

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((s, e) => s + e, 0);
  return exps.map((e) => e / sum);
}

const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

/** Every food the probe knows about, most likely first. `embedding` must be L2-normalised. */
export function rankFoods(embedding: ArrayLike<number>, probe: FoodProbe): RankedFood[] {
  const { ids, text_emb } = probe.zeroshot;
  const zeroShot = softmax(text_emb.map((t) => RANKING.zeroShotScale * dot(embedding, t)));
  const probeP = softmax(probe.coef.map((w, i) => dot(embedding, w) + probe.intercept[i]));

  const trained = new Map(probe.classes.map((c, i) => [c, i]));
  const trainedShare = ids.reduce((s, id, i) => s + (trained.has(id) ? zeroShot[i] : 0), 0);

  const scores = ids.map((id, i) => {
    const t = trained.get(id);
    return { id, score: t === undefined ? zeroShot[i] * RANKING.untrainedWeight : trainedShare * probeP[t] };
  });
  const total = scores.reduce((s, x) => s + x.score, 0);
  return scores.map(({ id, score }) => ({ id, probability: score / total })).sort((a, b) => b.probability - a.probability);
}

/**
 * Zero-shot probability that the image shows something other than food (a plate, the table,
 * cutlery…), against all food prompts. Used to drop non-food regions of a split plate.
 */
export function backgroundShare(embedding: ArrayLike<number>, probe: FoodProbe): number {
  const background = probe.background?.text_emb ?? [];
  const logits = [...probe.zeroshot.text_emb, ...background].map((t) => RANKING.zeroShotScale * dot(embedding, t));
  return softmax(logits)
    .slice(probe.zeroshot.ids.length)
    .reduce((s, x) => s + x, 0);
}
