/*
 * How a day went against its calorie target. Shared by the calorie ring and the calendar, so the
 * two never disagree about what "on target" means.
 */

/** ±5 % of the goal counts as on target. */
export const CALORIE_TOLERANCE = 0.05;

export type DayRating = "onTarget" | "under" | "over";

export function rateDay(eatenKcal: number, goalKcal: number): DayRating {
  if (goalKcal <= 0) return "onTarget";
  const ratio = eatenKcal / goalKcal;
  if (ratio > 1 + CALORIE_TOLERANCE) return "over";
  if (ratio >= 1 - CALORIE_TOLERANCE) return "onTarget";
  return "under";
}
