/*
 * Pure geometry for splitting a meal photo into regions (see segment.ts for the model that proposes
 * them). Masks live on a coarse grid over the image; every grid cell belongs to at most one region.
 */

export interface MaskGrid {
  width: number;
  height: number;
}

export interface Candidate {
  /** 1 inside, 0 outside, row-major on the grid. */
  mask: Uint8Array;
  /** The segmenter's own confidence in the mask (0–1). */
  score: number;
}

export interface Region {
  /** Cells this region owns (smaller regions take precedence over the ones they sit in). */
  mask: Uint8Array;
  /** Share of the whole image. */
  share: number;
  /** Bounding box of the owned cells, in grid cells, `x1`/`y1` exclusive. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

export const REGIONS = {
  minScore: 0.85,
  /** Smaller proposals are crumbs or garnish; larger than this they're the whole frame. */
  minShare: 0.01,
  maxShare: 0.95,
  /** Proposals overlapping a better one this much are duplicates. */
  maxOverlap: 0.7,
  /** What a region must still own after smaller ones took their cells (smaller crops are unreadable). */
  minOwnedShare: 0.03,
} as const;

const count = (m: Uint8Array) => m.reduce((s, v) => s + v, 0);

function iou(a: Uint8Array, b: Uint8Array): number {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    inter += a[i] & b[i];
    union += a[i] | b[i];
  }
  return union === 0 ? 0 : inter / union;
}

/**
 * Keeps confident, distinct proposals, then gives each cell to the smallest one covering it, so a
 * plate's mask is left with only its rim once the foods on it claim their cells.
 */
export function ownRegions(grid: MaskGrid, candidates: Candidate[]): Region[] {
  const cells = grid.width * grid.height;
  const kept: { mask: Uint8Array; area: number }[] = [];
  for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
    if (c.score < REGIONS.minScore) continue;
    const area = count(c.mask);
    if (area < REGIONS.minShare * cells || area > REGIONS.maxShare * cells) continue;
    if (kept.some((k) => iou(k.mask, c.mask) > REGIONS.maxOverlap)) continue;
    kept.push({ mask: c.mask, area });
  }

  kept.sort((a, b) => a.area - b.area);
  const owner = new Int16Array(cells).fill(-1);
  kept.forEach(({ mask }, k) => {
    for (let i = 0; i < cells; i++) if (mask[i] && owner[i] === -1) owner[i] = k;
  });

  return kept.flatMap((_, k): Region[] => {
    const mask = new Uint8Array(cells);
    const box = { x0: grid.width, y0: grid.height, x1: 0, y1: 0 };
    let owned = 0;
    for (let i = 0; i < cells; i++) {
      if (owner[i] !== k) continue;
      mask[i] = 1;
      owned++;
      const x = i % grid.width;
      const y = (i - x) / grid.width;
      box.x0 = Math.min(box.x0, x);
      box.y0 = Math.min(box.y0, y);
      box.x1 = Math.max(box.x1, x + 1);
      box.y1 = Math.max(box.y1, y + 1);
    }
    return owned >= REGIONS.minOwnedShare * cells ? [{ mask, share: owned / cells, box }] : [];
  });
}

/**
 * Grams for each food on the plate from its typical portion and how much of the plate it covers:
 * a food covering an average share (1/n of the food area) gets its typical portion, bigger or
 * smaller areas scale it within 0.4x–2x. A rough first guess; the user corrects it in the review.
 */
export function estimateGrams(foods: { portion: number; share: number }[]): number[] {
  const total = foods.reduce((s, f) => s + f.share, 0);
  return foods.map(({ portion, share }) => {
    const relative = total > 0 ? (share / total) * foods.length : 1;
    const grams = portion * Math.min(2, Math.max(0.4, relative));
    return Math.max(5, Math.round(grams / 5) * 5);
  });
}
