import { MEAL_SLOTS, type MealSlot } from "@/types/meal";
import type { MealPattern } from "@/types/plan";

/*
 * Meal slots (breakfast, lunch, dinner, snack): the default slot for the time of day and how the
 * daily calorie target is shared between them, per meal pattern.
 */

/** The slot a meal logged at `hour` (0–23, local) most likely belongs to. */
export function slotForHour(hour: number): MealSlot {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 17 && hour < 23) return "dinner";
  return "snack";
}

/**
 * Share of the day's calories per slot. Classic: 3 meals + snacks. 16:8: no breakfast; the first
 * meal of the window counts as lunch.
 */
export const SLOT_SHARES: Record<MealPattern, Record<MealSlot, number>> = {
  classic: { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 },
  if168: { breakfast: 0, lunch: 0.45, dinner: 0.4, snack: 0.15 },
};

/** kcal target per slot (rounded to 10 kcal). Slots with a 0 share are left out. */
export function slotTargets(dailyKcal: number, pattern: MealPattern = "classic"): Partial<Record<MealSlot, number>> {
  const shares = SLOT_SHARES[pattern];
  return Object.fromEntries(
    MEAL_SLOTS.filter((slot) => shares[slot] > 0).map((slot) => [slot, Math.round((dailyKcal * shares[slot]) / 10) * 10]),
  );
}
