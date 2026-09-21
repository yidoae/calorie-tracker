import { DISHES, FOOD_COLORS, type FoodColor } from "./catalog";
import type { ImageFeatures } from "./imageFeatures";

/**
 * Thresholds for the food/non-food check. These are heuristics tuned on colour and
 * texture statistics, not a trained classifier — expect the odd false positive or
 * negative until `analyzeFoodImage` is backed by a real vision model.
 */
const GUARD = {
  minBrightness: 0.12, // covered lens, night shot
  minTexture: 2, // blank wall, sky, solid colour
  personSkinShare: 0.12, // enough skin-toned pixels to be a face or body…
  personSmoothShare: 0.7, // …that are smooth (skin is soft, cooked food has grain and edges)…
  personBorderShare: 0.4, // …and don't run to the edges (wood tables, bread and sauces are skin-toned too)
  maxCoolShare: 0.35, // sky, water, screens
  minColourfulShare: 0.05, // only white/grey/black: paper, documents, screenshots
  minFoodShare: 0.3, // otherwise mostly grey/black/blue background
} as const;

/** Below this share of non-white food colours, the photo is judged on its whites too. */
const COLOURFUL_ENOUGH = 0.1;

/** Why an image was rejected, or `null` if it plausibly shows food. */
export function detectNoFood(f: ImageFeatures): string | null {
  if (f.brightness < GUARD.minBrightness) return "too dark";
  if (f.texture < GUARD.minTexture) return "blank or flat image";
  if (
    f.skinShare >= GUARD.personSkinShare &&
    f.skinSmoothShare >= GUARD.personSmoothShare &&
    f.skinBorderShare < GUARD.personBorderShare
  ) {
    return "person or face";
  }
  if (f.coolShare >= GUARD.maxCoolShare) return "mostly blue (sky, water or screen)";
  if (f.foodShare - f.colors.white < GUARD.minColourfulShare) return "no colour (text or screenshot)";
  if (f.foodShare < GUARD.minFoodShare) return "no food-like colours";
  return null;
}

export interface Plate {
  /** Name of the closest-matching dish, with the estimated portion weight. */
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** 0–1 value taken from byte `i` of the image hash — a stable per-image source of variation. */
const unit = (digest: Buffer, i: number) => digest[i % digest.length] / 255;

type Distribution = Record<FoodColor, number>;

/** Scales colour amounts to sum to 1, optionally ignoring white (plates and tables are white too). */
function distribution(amounts: Distribution, includeWhite: boolean): Distribution {
  const kept = { ...amounts, white: includeWhite ? amounts.white : 0 };
  const total = FOOD_COLORS.reduce((sum, c) => sum + kept[c], 0) || 1;
  return Object.fromEntries(FOOD_COLORS.map((c) => [c, kept[c] / total])) as Distribution;
}

/** How closely two colour distributions match: 1 = identical, 0 = disjoint. */
function similarity(a: Distribution, b: Distribution): number {
  return 1 - FOOD_COLORS.reduce((sum, c) => sum + Math.abs(a[c] - b[c]), 0) / 2;
}

/**
 * Picks the dish whose colours best match the photo, then scales the portion to how
 * much of the frame is food and varies each ingredient's weight a little. Everything
 * is derived from the image and its hash, so the same photo always gives the same plate.
 */
export function composePlate(f: ImageFeatures, digest: Buffer): Plate {
  // Plates read as white, so match on the other colours — unless there are hardly any (rice, yogurt).
  const includeWhite = f.foodShare - f.colors.white < COLOURFUL_ENOUGH;
  const observed = distribution(f.colors, includeWhite);

  // A little per-image jitter so similar-looking photos don't always collapse to one dish.
  const dish = DISHES.map((d, i) => ({
    d,
    score: similarity(observed, distribution(d.appearance, includeWhite)) + unit(digest, i) * 0.06,
  })).reduce(
    (best, cand) => (cand.score > best.score ? cand : best),
  ).d;

  // Fuller frame -> bigger portion (about 75%–125% of a typical serving), plus ±8% noise.
  const coverage = (f.foodShare - GUARD.minFoodShare) / (1 - GUARD.minFoodShare);
  const portion = 0.75 + 0.5 * Math.min(1, Math.max(0, coverage)) + (unit(digest, 20) - 0.5) * 0.16;

  const total = { grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
  dish.items.forEach(({ ingredient, grams }, i) => {
    const g = grams * portion * (0.9 + unit(digest, 24 + i) * 0.2); // each ingredient ±10%
    total.grams += g;
    total.calories += (g / 100) * ingredient.kcal;
    total.protein += (g / 100) * ingredient.protein;
    total.carbs += (g / 100) * ingredient.carbs;
    total.fat += (g / 100) * ingredient.fat;
  });

  const grams = Math.round(total.grams / 5) * 5;
  return { ...total, grams, name: `${dish.name} (~${grams} g)` };
}
