import type { ImageFeatures } from "./imageFeatures";

/**
 * Thresholds for the food/non-food check. These are heuristics tuned on colour and
 * texture statistics, not a trained classifier: expect the odd false positive or
 * negative. The CLIP classifier only runs on photos that pass.
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
