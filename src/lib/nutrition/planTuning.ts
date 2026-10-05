import type { DayTargets } from "@/types/plan";
import { KCAL_PER_GRAM } from "./macros";

/*
 * Fine-tuning a day's targets on the review screen. Two modes:
 * - calories locked: moving one macro rebalances the other two (in proportion to their current
 *   energy) so the total stays the same;
 * - calories free: the total follows the macros (4/4/9 kcal per gram).
 */

export type MacroField = keyof typeof KCAL_PER_GRAM;
export const MACRO_FIELDS: MacroField[] = ["protein", "carbs", "fat"];

export function energyOf(d: Pick<DayTargets, MacroField>): number {
  return Math.round(d.protein * KCAL_PER_GRAM.protein + d.carbs * KCAL_PER_GRAM.carbs + d.fat * KCAL_PER_GRAM.fat);
}

export function withMacro(day: DayTargets, field: MacroField, grams: number, lockCalories: boolean): DayTargets {
  const value = Math.max(0, Math.round(grams));
  if (!lockCalories) {
    const next = { ...day, [field]: value };
    return { ...next, calories: energyOf(next) };
  }

  const fixed = Math.min(value, Math.floor(day.calories / KCAL_PER_GRAM[field]));
  const others = MACRO_FIELDS.filter((f) => f !== field);
  const budget = day.calories - fixed * KCAL_PER_GRAM[field];
  const current = others.map((f) => day[f] * KCAL_PER_GRAM[f]);
  const total = current[0] + current[1];
  const next: DayTargets = { ...day, [field]: fixed };
  others.forEach((f, i) => {
    const share = total > 0 ? current[i] / total : 0.5;
    next[f] = Math.max(0, Math.round((budget * share) / KCAL_PER_GRAM[f]));
  });
  return next;
}

/** New calorie total; protein stays, carbs and fat scale to fill the rest. */
export function withCalories(day: DayTargets, calories: number): DayTargets {
  const kcal = Math.max(0, Math.round(calories));
  const budget = Math.max(0, kcal - day.protein * KCAL_PER_GRAM.protein);
  const current = day.carbs * KCAL_PER_GRAM.carbs + day.fat * KCAL_PER_GRAM.fat;
  const carbShare = current > 0 ? (day.carbs * KCAL_PER_GRAM.carbs) / current : 0.5;
  return {
    calories: kcal,
    protein: day.protein,
    carbs: Math.round((budget * carbShare) / KCAL_PER_GRAM.carbs),
    fat: Math.round((budget * (1 - carbShare)) / KCAL_PER_GRAM.fat),
  };
}

/** Slider bounds for a macro, in grams (protein relative to body weight). */
export function macroRange(field: MacroField | "calories", weightKg: number): { min: number; max: number; step: number } {
  switch (field) {
    case "protein":
      return { min: Math.round(weightKg * 0.8), max: Math.round(weightKg * 3.2), step: 1 };
    case "carbs":
      return { min: 0, max: 600, step: 5 };
    case "fat":
      return { min: 20, max: 300, step: 1 };
    case "calories":
      return { min: 1000, max: 5000, step: 10 };
  }
}
