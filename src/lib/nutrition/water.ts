/*
 * Water: default daily goal and quick-add amounts. EFSA (2010) sets adequate total water intake at
 * 2.0 L/day for women and 2.5 L/day for men; part of it comes from food, so these drink goals are
 * on the generous side.
 */

export const WATER_DEFAULT_ML = { male: 2500, female: 2000, unknown: 2000 } as const;

/** One glass and one bottle. */
export const WATER_STEPS = [250, 500] as const;

/** One glass on the dashboard's glass row. */
export const GLASS_ML = 250;
const GLASSES = { min: 4, max: 16 } as const;

/** How many glasses the goal is (one row of glasses per 2 L, 4–16 glasses). */
export const glassCount = (goalMl: number) => Math.min(GLASSES.max, Math.max(GLASSES.min, Math.round(goalMl / GLASS_ML)));

/** Glasses already full for `totalMl` (whole glasses only). */
export const filledGlasses = (totalMl: number) => Math.floor(totalMl / GLASS_ML);

export function defaultWaterGoal(sex: "male" | "female" | null): number {
  return sex ? WATER_DEFAULT_ML[sex] : WATER_DEFAULT_ML.unknown;
}
