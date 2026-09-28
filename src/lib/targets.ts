import { customPlanTargets, type CustomPlan } from "./customPlan";
import { DAILY_GOALS, type Macros } from "./goals";
import { calculateTargets, type Profile } from "./profile";

export type TargetSource = "custom" | "profile" | "default";

/** The daily targets in effect: an active custom plan wins, then the profile, then the defaults. */
export function resolveTargets(profile: Profile | null, customPlan: CustomPlan | null): { targets: Macros; source: TargetSource } {
  if (customPlan?.active) return { targets: customPlanTargets(customPlan), source: "custom" };
  if (profile) return { targets: calculateTargets(profile), source: "profile" };
  return { targets: DAILY_GOALS, source: "default" };
}
