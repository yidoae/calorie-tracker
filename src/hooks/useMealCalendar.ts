"use client";

import { useMemo, useState } from "react";
import { addMonths, dayKey, startOfMonth } from "@/lib/dates";
import { sumMacros } from "@/lib/nutrition/macros";
import type { MealDTO } from "@/types/meal";
import type { Macros } from "@/types/nutrition";
import { useMealsInRange } from "./useMeals";

/** Month navigation, the selected day, and the month's meals grouped by local day. */
export function useMealCalendar(targets: Macros) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
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

  const todayKey = dayKey(new Date());
  const monthKey = dayKey(month).slice(0, 7);
  const selectedKey = dayKey(selected);

  return {
    month,
    loading,
    error,
    todayKey,
    selectedKey,
    selected,
    isCurrentMonth: monthKey === todayKey.slice(0, 7),
    selectedInView: selectedKey.slice(0, 7) === monthKey,
    selectedMeals: byDay.get(selectedKey) ?? [],
    mealsOn: (key: string) => byDay.get(key),
    overGoal: (key: string) => {
      const dayMeals = byDay.get(key);
      return dayMeals ? sumMacros(dayMeals).calories > targets.calories : false;
    },
    previousMonth: () => setMonth((m) => addMonths(m, -1)),
    nextMonth: () => setMonth((m) => addMonths(m, 1)),
    select: setSelected,
  };
}
