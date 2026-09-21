export type MacroKey = "calories" | "protein" | "carbs" | "fat";
export type Macros = Record<MacroKey, number>;

export const MACRO_KEYS: MacroKey[] = ["calories", "protein", "carbs", "fat"];

/** Fallback targets, used until the user fills in their profile (see profile.ts). */
export const DAILY_GOALS: Macros = {
  calories: 2000, // kcal
  protein: 150, // g
  carbs: 250, // g
  fat: 65, // g
};

export function sumMacros(meals: readonly Macros[]): Macros {
  return meals.reduce(
    (sum, m) => ({
      calories: sum.calories + m.calories,
      protein: sum.protein + m.protein,
      carbs: sum.carbs + m.carbs,
      fat: sum.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
