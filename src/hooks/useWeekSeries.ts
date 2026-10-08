"use client";

import { useMemo, useState } from "react";
import { resolveTargets } from "@/lib/nutrition/targets";
import { dailySeries } from "@/lib/nutrition/trends";
import { useMealsInRange } from "./useMeals";
import { useNutritionPlan } from "./useNutritionPlan";

const DAYS = 7;

/**
 * The dashboard's "Son 7 gün" chart: calories per day against that day's target, today last.
 * The summary only counts finished, logged days (today is still running; empty days aren't 0).
 */
export function useWeekSeries() {
  const { planOn, legacyProfile, legacyCustomPlan } = useNutritionPlan();
  // Midnight today, fixed for the life of the screen so the range key is stable.
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const { from, to } = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - (DAYS - 1));
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    return { from: start, to: end };
  }, [today]);
  const { meals, loading, error } = useMealsInRange(from, to);

  const series = useMemo(
    () => dailySeries(meals, DAYS, today, (date) => resolveTargets(legacyProfile, legacyCustomPlan, planOn(date), date).targets),
    [meals, today, legacyProfile, legacyCustomPlan, planOn],
  );

  const summary = useMemo(() => {
    const past = series.slice(0, -1).filter((d) => d.logged);
    return {
      loggedDays: past.length,
      averageKcal: past.length ? Math.round(past.reduce((sum, d) => sum + d.totals.calories, 0) / past.length) : null,
      onTargetDays: past.filter((d) => d.rating === "onTarget").length,
    };
  }, [series]);

  return { series, summary, loading, error };
}
