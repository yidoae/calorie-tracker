"use client";

import { useMemo, useState } from "react";
import { energyOf, withCalories, withMacro, type MacroField } from "@/lib/nutrition/planTuning";
import type { DayTargets, NutritionPlan } from "@/types/plan";

export type TunerDay = "base" | "training" | "rest";

/**
 * The fine-tuning desk: editable copies of the plan's day targets. With calorie cycling there are
 * two independent days (training / rest) and the weekly average becomes the plan's base.
 */
export function usePlanTuner(plan: NutritionPlan) {
  const [days, setDays] = useState<Record<TunerDay, DayTargets>>(() => ({
    base: plan.base,
    training: plan.cycle?.training ?? plan.base,
    rest: plan.cycle?.rest ?? plan.base,
  }));
  const [activeDay, setActiveDay] = useState<TunerDay>(plan.cycle ? "training" : "base");
  const [lockCalories, setLockCalories] = useState(true);

  const cycling = plan.cycle !== null;
  const trainingDays = plan.inputs.trainingDays.length;
  const current = days[activeDay];

  /** Weekly average when cycling (what the dashboard shows as the plan's daily base). */
  const weeklyAverage = useMemo(() => {
    if (!cycling) return days.base;
    const avg = (k: keyof DayTargets) => Math.round((days.training[k] * trainingDays + days.rest[k] * (7 - trainingDays)) / 7);
    return { calories: avg("calories"), protein: avg("protein"), carbs: avg("carbs"), fat: avg("fat") };
  }, [cycling, days, trainingDays]);

  const original = plan.cycle ? { training: plan.cycle.training, rest: plan.cycle.rest } : { base: plan.base };
  const dirty = JSON.stringify(cycling ? { training: days.training, rest: days.rest } : { base: days.base }) !== JSON.stringify(original);

  const update = (next: DayTargets) => setDays((d) => ({ ...d, [activeDay]: next }));

  return {
    activeDay,
    setActiveDay,
    cycling,
    days,
    current,
    /** Energy of the macros; differs from `current.calories` only while calories are unlocked. */
    macroEnergy: energyOf(current),
    weeklyAverage,
    lockCalories,
    setLockCalories,
    dirty,
    perKg: (grams: number) => Math.round((grams / plan.inputs.weightKg) * 10) / 10,
    setMacro: (field: MacroField, grams: number) => update(withMacro(current, field, grams, lockCalories)),
    setCalories: (kcal: number) => update(withCalories(current, kcal)),
    reset: () =>
      setDays({ base: plan.base, training: plan.cycle?.training ?? plan.base, rest: plan.cycle?.rest ?? plan.base }),
    /** The plan with the tuned numbers. */
    result: (): NutritionPlan => ({
      ...plan,
      base: weeklyAverage,
      cycle: cycling ? { training: days.training, rest: days.rest } : null,
    }),
  };
}
