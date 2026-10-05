"use client";

import { useMemo } from "react";
import { resolveTargets } from "@/lib/nutrition/targets";
import { useNutritionPlan } from "./useNutritionPlan";

/**
 * Today's targets and where they come from: the wizard plan (training/rest day when cycling),
 * else the legacy custom plan or profile, else defaults.
 */
export function useCalorieGoal() {
  const { plan, legacyProfile, legacyCustomPlan } = useNutritionPlan();
  return useMemo(
    () => ({ ...resolveTargets(legacyProfile, legacyCustomPlan, plan, new Date()), plan, legacyProfile, legacyCustomPlan }),
    [legacyProfile, legacyCustomPlan, plan],
  );
}
