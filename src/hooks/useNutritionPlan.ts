"use client";

import { useCallback, useMemo } from "react";
import type { NutritionPlan } from "@/types/plan";
import { useAuth } from "./useAuth";

/**
 * The account's active nutrition plan (from the plan wizard), plus the legacy calculator profile
 * and custom plan saved before the wizard existed. Legacy data is read-only now: it keeps driving
 * the targets until the user creates a new plan.
 */
export function useNutritionPlan() {
  const { settings, updateSettings } = useAuth();

  const legacyProfile = useMemo(
    () => settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null,
    [settings.profiles, settings.activeProfileId],
  );

  const savePlan = useCallback((plan: NutritionPlan) => updateSettings((current) => ({ ...current, nutritionPlan: plan })), [updateSettings]);
  const removePlan = useCallback(() => updateSettings((current) => ({ ...current, nutritionPlan: null })), [updateSettings]);

  return {
    plan: settings.nutritionPlan,
    legacyProfile,
    legacyCustomPlan: settings.customPlan,
    savePlan,
    removePlan,
  };
}
