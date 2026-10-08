"use client";

import { useCallback, useMemo } from "react";
import { dayKey } from "@/lib/dates";
import { defaultPlanTitle, periodOn, planOn as planOnDate, removePeriod as without, upsertPeriod } from "@/lib/nutrition/schedule";
import type { NutritionPlan, PlanPeriod } from "@/types/plan";
import { useAuth } from "./useAuth";

/**
 * The account's plans: the main plan (from the plan wizard), the dated periods that replace it
 * (Cut, Bulk…), plus the legacy calculator profile and custom plan saved before the wizard
 * existed. Legacy data is read-only now: it keeps driving the targets until the user creates a plan.
 *
 * `plan` is the plan in effect today; `planOn(date)` gives the one for any other day.
 */
export function useNutritionPlan() {
  const { settings, updateSettings } = useAuth();
  const { nutritionPlan: mainPlan, planPeriods: periods, mainPlanTitle } = settings;

  const legacyProfile = useMemo(
    () => settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null,
    [settings.profiles, settings.activeProfileId],
  );

  const planOn = useCallback((date: Date) => planOnDate({ nutritionPlan: mainPlan, planPeriods: periods }, date), [mainPlan, periods]);
  const todayKey = dayKey(new Date());
  const activePeriod = useMemo(() => periodOn(periods, todayKey), [periods, todayKey]);

  const savePlan = useCallback((plan: NutritionPlan) => updateSettings((current) => ({ ...current, nutritionPlan: plan })), [updateSettings]);
  const removePlan = useCallback(() => updateSettings((current) => ({ ...current, nutritionPlan: null })), [updateSettings]);
  const saveMainTitle = useCallback(
    (title: string) => updateSettings((current) => ({ ...current, mainPlanTitle: title.trim() || null })),
    [updateSettings],
  );
  const savePeriod = useCallback(
    (period: PlanPeriod) => updateSettings((current) => ({ ...current, planPeriods: upsertPeriod(current.planPeriods, period) })),
    [updateSettings],
  );
  const removePeriod = useCallback(
    (id: string) => updateSettings((current) => ({ ...current, planPeriods: without(current.planPeriods, id) })),
    [updateSettings],
  );

  return {
    /** The plan in effect today: the active period's, else the main plan. */
    plan: activePeriod?.plan ?? mainPlan,
    planOn,
    mainPlan,
    mainPlanTitle: mainPlanTitle ?? (mainPlan ? defaultPlanTitle(mainPlan.inputs.goal) : null),
    periods,
    activePeriod,
    legacyProfile,
    legacyCustomPlan: settings.customPlan,
    savePlan,
    removePlan,
    saveMainTitle,
    savePeriod,
    removePeriod,
  };
}
