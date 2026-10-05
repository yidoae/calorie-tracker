import { MICRO_KEYS, type MealItem, type MicroKey } from "@/types/nutrition";

/*
 * Micronutrient totals and daily reference values. Values are per 100 g on each item and only
 * known for some foods, so totals carry how many items had data.
 */

export interface MicroTotals {
  values: Record<MicroKey, number>;
  /** Items with micronutrient data / all items. */
  covered: number;
  total: number;
}

export function sumMicros(items: readonly Pick<MealItem, "grams" | "micros">[]): MicroTotals {
  const values: Record<MicroKey, number> = { fiber: 0, sugar: 0, satFat: 0, sodium: 0 };
  let covered = 0;
  for (const item of items) {
    if (!item.micros) continue;
    covered += 1;
    for (const key of MICRO_KEYS) values[key] += ((item.micros[key] ?? 0) * item.grams) / 100;
  }
  return { values, covered, total: items.length };
}

export interface MicroReference {
  /** "min": a floor to reach (fibre); "max": a limit to stay under. */
  mode: "min" | "max";
  amount: number;
}

/**
 * Daily references for a calorie target:
 * - fibre: 14 g per 1000 kcal (IOM 2005 Adequate Intake);
 * - total sugars: 90 g (EU reference intake, Regulation 1169/2011);
 * - saturated fat: under 10 % of energy (WHO 2023);
 * - sodium: under 2000 mg (WHO 2012).
 */
export function microReferences(calories: number): Record<MicroKey, MicroReference> {
  return {
    fiber: { mode: "min", amount: Math.round((14 * calories) / 1000) },
    sugar: { mode: "max", amount: 90 },
    satFat: { mode: "max", amount: Math.round((calories * 0.1) / 9) },
    sodium: { mode: "max", amount: 2000 },
  };
}
