"use client";

import { useMemo, useState } from "react";
import { resolveTargets } from "@/lib/nutrition/targets";
import { dailySeries, streaks, summarize } from "@/lib/nutrition/trends";
import { useMealsInRange } from "./useMeals";
import { useNutritionPlan } from "./useNutritionPlan";

export const TREND_WINDOWS = [7, 30, 90] as const;
export type TrendWindow = (typeof TREND_WINDOWS)[number];

/** Calories against the goal line, streaks and averages over the last 7/30/90 days. */
export function useTrends() {
  const { plan, legacyProfile, legacyCustomPlan } = useNutritionPlan();
  const [days, setDays] = useState<TrendWindow>(30);
  // Midnight today, fixed for the life of the screen so the range key is stable.
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const { from, to } = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    return { from: start, to: end };
  }, [today, days]);
  const { meals, loading, error } = useMealsInRange(from, to);

  const series = useMemo(
    () => dailySeries(meals, days, today, (date) => resolveTargets(legacyProfile, legacyCustomPlan, plan, date).targets),
    [meals, days, today, legacyProfile, legacyCustomPlan, plan],
  );

  return {
    days,
    setDays,
    loading,
    error,
    series,
    streak: useMemo(() => streaks(series), [series]),
    summary: useMemo(() => summarize(series), [series]),
  };
}
