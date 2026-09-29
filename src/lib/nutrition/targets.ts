import type { Macros } from "@/types/nutrition";
import type { NutritionPlan } from "@/types/plan";
import type { CustomPlan, Profile } from "@/types/profile";
import { customPlanTargets } from "./customPlan";
import { calculateTargets } from "./energy";
import { DAILY_GOALS } from "./macros";
import { targetsForDate, type DayType } from "./plan";

export type TargetSource = "plan" | "custom" | "profile" | "default";

export interface ResolvedTargets {
  targets: Macros;
  source: TargetSource;
  /** Training or rest day when the active plan cycles calories; null otherwise. */
  dayType: DayType | null;
}

/**
 * The daily targets in effect on `date`: the wizard plan wins (training/rest day when cycling),
 * then a legacy custom plan, then a legacy profile, then the defaults.
 */
export function resolveTargets(
  profile: Profile | null,
  customPlan: CustomPlan | null,
  plan: NutritionPlan | null = null,
  date: Date = new Date(),
): ResolvedTargets {
  if (plan) {
    const { targets, dayType } = targetsForDate(plan, date);
    return { targets, source: "plan", dayType };
  }
  if (customPlan?.active) return { targets: customPlanTargets(customPlan), source: "custom", dayType: null };
  if (profile) return { targets: calculateTargets(profile), source: "profile", dayType: null };
  return { targets: DAILY_GOALS, source: "default", dayType: null };
}
