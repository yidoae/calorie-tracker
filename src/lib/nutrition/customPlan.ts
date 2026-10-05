import type { Macros } from "@/types/nutrition";
import type { CustomPlan } from "@/types/profile";

/** Targets of a legacy custom plan (saved before the plan wizard existed). */
export function customPlanTargets(p: CustomPlan): Macros {
  return { calories: p.calories, protein: p.minProtein, carbs: p.carbs, fat: p.fat };
}
