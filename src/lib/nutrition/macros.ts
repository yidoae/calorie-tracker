import type { Macros, MealItem } from "@/types/nutrition";

/** Fallback targets, used until the user fills in their profile. */
export const DAILY_GOALS: Macros = {
  calories: 2000, // kcal
  protein: 150, // g
  carbs: 250, // g
  fat: 65, // g
};

export const ZERO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** kcal per gram of each macronutrient (Atwater factors). */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export function sumMacros(list: readonly Macros[]): Macros {
  return list.reduce(
    (sum, m) => ({
      calories: sum.calories + m.calories,
      protein: sum.protein + m.protein,
      carbs: sum.carbs + m.carbs,
      fat: sum.fat + m.fat,
    }),
    ZERO_MACROS,
  );
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Display precision: whole kcal, grams to one decimal. */
export function roundMacros(m: Macros): Macros {
  return { calories: Math.round(m.calories), protein: round1(m.protein), carbs: round1(m.carbs), fat: round1(m.fat) };
}

/** Nutrition of one meal component at its current portion (per-100 g values × grams / 100). */
export function itemMacros(item: Pick<MealItem, "grams" | "per100g">): Macros {
  const f = item.grams / 100;
  return {
    calories: item.per100g.calories * f,
    protein: item.per100g.protein * f,
    carbs: item.per100g.carbs * f,
    fat: item.per100g.fat * f,
  };
}

/** Total nutrition of a list of components, rounded for display and storage. */
export function totalOfItems(items: readonly Pick<MealItem, "grams" | "per100g">[]): Macros {
  return roundMacros(sumMacros(items.map(itemMacros)));
}

/** Most grams one meal component may have (matches mealItemSchema). */
export const MAX_ITEM_GRAMS = 5000;

/** Grams typed by the user ("150", "62,5"); null when empty or outside (0, 5000]. */
export function parseGrams(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const grams = Number.parseFloat(t);
  return grams > 0 && grams <= MAX_ITEM_GRAMS ? round1(grams) : null;
}

/** Share (0–1) of `value` against `goal`, clamped; 0 when there's no goal. */
export function progressOf(value: number, goal: number): number {
  return goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
}
