import { calorieFloor } from "@calorie/core/nutrition/plan";
import { energyOf, tunedPlan, tunerDays, withCalories, withMacro, type MacroField, type TunerDay } from "@calorie/core/nutrition/planTuning";
import { LOCALE } from "@calorie/core/dates";
import type { DayTargets, NutritionPlan } from "@calorie/core/schemas/plan";
import { planPayloadSchema } from "@calorie/core/schemas/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toAppError } from "@/services/errors";
import { savePlan } from "@/services/planService";
import { useToast } from "./useToast";

/**
 * The fine-tuning desk (US4, FR-009), ported from the web app: editable copies of the plan's day
 * targets. With calorie cycling there are two days (training / rest) and the weekly average becomes
 * the plan's base. All math is core's (planTuning.ts), so no day goes below the calorie floor and
 * the macros always add up. `save` makes the tuned plan the active one through save_plan.
 */
export function usePlanTuner(plan: NutritionPlan) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const floor = calorieFloor(plan.inputs.sex);
  const [days, setDays] = useState(() => tunerDays(plan));
  const [activeDay, setActiveDay] = useState<TunerDay>(plan.cycle ? "training" : "base");
  const [lockCalories, setLockCalories] = useState(true);

  const cycling = plan.cycle !== null;
  const current = days[activeDay];
  const result = tunedPlan(plan, days);
  const original = tunerDays(plan);
  const shown: TunerDay[] = cycling ? ["training", "rest"] : ["base"];
  const dirty = shown.some((day) => JSON.stringify(days[day]) !== JSON.stringify(original[day]));

  const update = (next: DayTargets) => setDays((d) => ({ ...d, [activeDay]: next }));

  const mutation = useMutation({
    mutationFn: () => savePlan(planPayloadSchema.parse(result)),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["activePlan"] });
      toast.show("success", "Aktif planın kaydedildi", `${saved.cycle ? "Haftalık ortalama" : "Günlük hedef"} ${saved.base.calories.toLocaleString(LOCALE)} kcal`);
    },
  });

  return {
    activeDay,
    setActiveDay,
    cycling,
    current,
    floor,
    /** Energy of the macros; differs from `current.calories` only while calories are unlocked. */
    macroEnergy: energyOf(current),
    /** The plan's base as it will be saved (the weekly average when cycling). */
    weeklyAverage: result.base,
    lockCalories,
    setLockCalories,
    dirty,
    perKg: (grams: number) => Math.round((grams / plan.inputs.weightKg) * 10) / 10,
    setMacro: (field: MacroField, grams: number) => update(withMacro(current, field, grams, lockCalories, floor)),
    setCalories: (kcal: number) => update(withCalories(current, kcal, floor)),
    reset: () => setDays(tunerDays(plan)),
    /** Saves the tuned plan as the active plan; true when it was saved. */
    save: async (): Promise<boolean> => {
      if (mutation.isPending) return false;
      try {
        await mutation.mutateAsync();
        return true;
      } catch {
        return false;
      }
    },
    pending: mutation.isPending,
    error: mutation.error ? toAppError(mutation.error) : null,
  };
}
