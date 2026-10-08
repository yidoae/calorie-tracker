"use client";

import { useMemo, useState } from "react";
import { addMonths, dayKey, dayToDate, startOfMonth } from "@/lib/dates";
import { rateDay, type DayRating } from "@/lib/nutrition/dayRating";
import { sumMacros } from "@/lib/nutrition/macros";
import { resolveTargets } from "@/lib/nutrition/targets";
import type { MealDTO } from "@/types/meal";
import type { Macros } from "@/types/nutrition";
import { useMealsInRange } from "./useMeals";
import { useNutritionPlan } from "./useNutritionPlan";

/**
 * Month navigation, the selected day, the month's meals grouped by local day, and how each day
 * went against that day's own targets (training and rest days differ when cycling).
 */
export function useMealCalendar() {
  const { planOn, legacyProfile, legacyCustomPlan } = useNutritionPlan();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  /** -1 after going back a month, 1 after going forward: the grid slides that way. */
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selected, setSelected] = useState(() => new Date());
  const monthEnd = useMemo(() => addMonths(month, 1), [month]);
  const { meals, loading, error } = useMealsInRange(month, monthEnd);

  const byDay = useMemo(() => {
    const groups = new Map<string, MealDTO[]>();
    for (const meal of meals) {
      const key = dayKey(new Date(meal.createdAt));
      groups.set(key, [...(groups.get(key) ?? []), meal]);
    }
    return groups;
  }, [meals]);

  const targetsOn = (date: Date): Macros => resolveTargets(legacyProfile, legacyCustomPlan, planOn(date), date).targets;

  const ratings = useMemo(() => {
    const result = new Map<string, DayRating>();
    for (const [key, dayMeals] of byDay) {
      const date = dayToDate(key);
      const goal = resolveTargets(legacyProfile, legacyCustomPlan, planOn(date), date).targets;
      result.set(key, rateDay(sumMacros(dayMeals).calories, goal.calories));
    }
    return result;
  }, [byDay, legacyProfile, legacyCustomPlan, planOn]);

  const todayKey = dayKey(new Date());
  const monthKey = dayKey(month).slice(0, 7);
  const selectedKey = dayKey(selected);

  return {
    month,
    direction,
    loading,
    error,
    todayKey,
    selectedKey,
    selected,
    selectedTargets: targetsOn(selected),
    isCurrentMonth: monthKey === todayKey.slice(0, 7),
    selectedInView: selectedKey.slice(0, 7) === monthKey,
    selectedMeals: byDay.get(selectedKey) ?? [],
    mealsOn: (key: string) => byDay.get(key),
    ratingOn: (key: string) => ratings.get(key) ?? null,
    previousMonth: () => {
      setDirection(-1);
      setMonth((m) => addMonths(m, -1));
    },
    nextMonth: () => {
      setDirection(1);
      setMonth((m) => addMonths(m, 1));
    },
    select: setSelected,
  };
}
