import type { Macros } from "./goals";

/** A user-authored set of daily targets that overrides the profile's calculated ones. */
export interface CustomPlan {
  calories: number;
  minProtein: number;
  carbs: number;
  fat: number;
  active: boolean;
}

export type MacroPresetKey = "highProtein" | "balanced" | "lowCarb";

/** Ratios of daily calories per macro (protein/carbs by 4 kcal/g, fat by 9 kcal/g). */
export const MACRO_PRESETS: Record<MacroPresetKey, { label: string; protein: number; carbs: number; fat: number }> = {
  highProtein: { label: "High Protein / Bodybuilding (40/40/20)", protein: 0.4, carbs: 0.4, fat: 0.2 },
  balanced: { label: "Balanced (50/30/20)", protein: 0.3, carbs: 0.5, fat: 0.2 },
  lowCarb: { label: "Low Carb / Keto", protein: 0.25, carbs: 0.05, fat: 0.7 },
};

export const CALORIE_LIMITS = { min: 800, max: 8000 } as const;

export function presetMacros(calories: number, preset: MacroPresetKey): { protein: number; carbs: number; fat: number } {
  const ratio = MACRO_PRESETS[preset];
  return {
    protein: Math.round((calories * ratio.protein) / 4),
    carbs: Math.round((calories * ratio.carbs) / 4),
    fat: Math.round((calories * ratio.fat) / 9),
  };
}

export function isValidCustomPlan(p: Pick<CustomPlan, "calories" | "minProtein" | "carbs" | "fat">): boolean {
  const nums = [p.calories, p.minProtein, p.carbs, p.fat];
  return (
    nums.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0) &&
    p.calories >= CALORIE_LIMITS.min &&
    p.calories <= CALORIE_LIMITS.max
  );
}

export function customPlanTargets(p: CustomPlan): Macros {
  return { calories: p.calories, protein: p.minProtein, carbs: p.carbs, fat: p.fat };
}

/** Parses a stored custom plan, returning null for anything missing or malformed. */
export function parseCustomPlan(raw: unknown): CustomPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as CustomPlan;
  return isValidCustomPlan(p)
    ? { calories: p.calories, minProtein: p.minProtein, carbs: p.carbs, fat: p.fat, active: Boolean(p.active) }
    : null;
}
