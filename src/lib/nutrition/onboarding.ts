import { INTENSITY_RANGE, type PlanGoal, type PlanInputs, type TrainingStyle } from "@/types/plan";
import type { OnboardingInput } from "@/types/onboarding";
import type { ActivityLevel } from "@/types/profile";

/*
 * The first-time setup asks fewer questions than the plan wizard. These rules turn its answers
 * into full PlanInputs, so both build the plan with the same formula (lib/nutrition/plan.ts).
 */

/** Within this many kg of the goal weight the plan maintains instead of cutting or bulking. */
const MAINTAIN_BAND_KG = 1;

/**
 * Activity levels as a training routine whose activity factor (plan.ts#activityFactor) lands
 * close to the classic multipliers: 1.2 · ~1.38 · ~1.5 · ~1.58 · ~1.74.
 */
const ACTIVITY_ROUTINE: Record<ActivityLevel, { style: TrainingStyle; days: number[] }> = {
  sedentary: { style: "sedentary", days: [] },
  light: { style: "cardio", days: [0, 3] },
  moderate: { style: "strength", days: [0, 1, 3, 4] },
  active: { style: "strength", days: [0, 1, 2, 3, 4] },
  veryActive: { style: "cardio", days: [0, 1, 2, 3, 4, 5] },
};

export function goalFromWeights(weightKg: number, targetWeightKg: number): PlanGoal {
  const diff = targetWeightKg - weightKg;
  if (Math.abs(diff) < MAINTAIN_BAND_KG) return "maintain";
  return diff < 0 ? "cut" : "bulk";
}

export function onboardingToPlanInputs(o: OnboardingInput): PlanInputs {
  const goal = goalFromWeights(o.weightKg, o.targetWeightKg);
  const routine = ACTIVITY_ROUTINE[o.activity];
  return {
    sex: o.sex,
    heightCm: o.heightCm,
    weightKg: o.weightKg,
    age: o.age,
    targetWeightKg: goal === "maintain" ? null : o.targetWeightKg,
    goal,
    intensity: goal === "maintain" ? 0 : INTENSITY_RANGE[goal].default,
    trainingStyle: routine.style,
    split: routine.style === "strength" ? "upperLower" : null,
    trainingDays: routine.days,
    dietStyle: o.dietStyle,
    fatPerKg: o.fatPerKg,
    mealPattern: "classic",
    fastingWindowStart: 12,
    cycling: false,
  };
}
