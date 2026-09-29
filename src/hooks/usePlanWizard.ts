"use client";

import { useMemo, useState } from "react";
import { formulaPlan, goalAdjustment, weeklyChangeKg, weeksToGoal } from "@/lib/nutrition/plan";
import {
  INTENSITY_RANGE,
  TRAINING_DAYS_RANGE,
  planInputsSchema,
  targetWeightMatchesGoal,
  type DietStyle,
  type MealPattern,
  type PlanGoal,
  type PlanInputs,
  type StrengthSplit,
  type TrainingStyle,
} from "@/types/plan";
import { inRange, type Profile } from "@/types/profile";

export const WIZARD_STEPS = [
  { id: "body", title: "Biyometri ve hedef" },
  { id: "training", title: "Antrenman" },
  { id: "diet", title: "Diyet ve zamanlama" },
  { id: "advanced", title: "Gelişmiş" },
] as const;

/** A sensible weekday spread for N sessions (0 = Monday). */
export const DEFAULT_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

/** The form keeps number fields as typed text; everything else is already typed. */
export interface WizardForm extends Omit<PlanInputs, "heightCm" | "weightKg" | "age" | "targetWeightKg"> {
  heightCm: string;
  weightKg: string;
  age: string;
  targetWeightKg: string;
}

const toNumber = (v: string) => Number(v.replace(",", "."));

function initialForm(previous: PlanInputs | null, legacy: Profile | null): WizardForm {
  if (previous) {
    return {
      ...previous,
      heightCm: String(previous.heightCm),
      weightKg: String(previous.weightKg),
      age: String(previous.age),
      targetWeightKg: previous.targetWeightKg != null ? String(previous.targetWeightKg) : "",
    };
  }
  return {
    sex: legacy?.gender ?? "male",
    heightCm: legacy ? String(legacy.heightCm) : "",
    weightKg: legacy ? String(legacy.weightKg) : "",
    age: legacy ? String(legacy.age) : "",
    targetWeightKg: legacy?.targetWeightKg != null ? String(legacy.targetWeightKg) : "",
    goal: "cut",
    intensity: INTENSITY_RANGE.cut.default,
    trainingStyle: "strength",
    split: "upperLower",
    trainingDays: DEFAULT_DAYS[4],
    dietStyle: "highProtein",
    mealPattern: "classic",
    fastingWindowStart: 12,
    cycling: false,
  };
}

/**
 * The 4-step plan wizard: form state, per-step validation, navigation (with direction for the
 * slide animation) and a live preview computed with the same formula the server uses.
 */
export function usePlanWizard(previous: PlanInputs | null, legacy: Profile | null) {
  const [form, setForm] = useState<WizardForm>(() => initialForm(previous, legacy));
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const numbers = {
    heightCm: toNumber(form.heightCm),
    weightKg: toNumber(form.weightKg),
    age: toNumber(form.age),
    targetWeightKg: form.targetWeightKg.trim() === "" ? null : toNumber(form.targetWeightKg),
  };

  const errors = {
    heightCm: form.heightCm !== "" && !inRange("heightCm", numbers.heightCm),
    weightKg: form.weightKg !== "" && !inRange("weightKg", numbers.weightKg),
    age: form.age !== "" && !inRange("age", numbers.age),
    targetWeightKg: numbers.targetWeightKg !== null && !inRange("weightKg", numbers.targetWeightKg),
    /** e.g. "kas kazanımı" with a target weight below today's weight. */
    targetDirection:
      numbers.targetWeightKg !== null &&
      inRange("weightKg", numbers.weightKg) &&
      !targetWeightMatchesGoal({ goal: form.goal, weightKg: numbers.weightKg, targetWeightKg: numbers.targetWeightKg }),
    trainingDays:
      form.trainingStyle !== "sedentary" &&
      (form.trainingDays.length < TRAINING_DAYS_RANGE.min || form.trainingDays.length > TRAINING_DAYS_RANGE.max),
  };

  const parsed = planInputsSchema.safeParse({ ...form, ...numbers });
  const inputs = parsed.success ? parsed.data : null;

  const bodyValid =
    inRange("heightCm", numbers.heightCm) &&
    inRange("weightKg", numbers.weightKg) &&
    inRange("age", numbers.age) &&
    !errors.targetWeightKg &&
    !errors.targetDirection;
  const stepValid = [bodyValid, !errors.trainingDays, true, true];

  /** Live numbers for the side panel, once the body data is complete. */
  const preview = useMemo(() => {
    if (!inputs) return null;
    const result = formulaPlan(inputs);
    const adjustment = goalAdjustment(inputs);
    return { ...result, adjustment, weeklyChange: weeklyChangeKg(adjustment), weeksToGoal: weeksToGoal(inputs) };
  }, [inputs]);

  function set<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return {
    form,
    step,
    direction,
    errors,
    stepValid,
    inputs,
    preview,
    isLast: step === WIZARD_STEPS.length - 1,
    set,
    setGoal: (goal: PlanGoal) =>
      setForm((f) => ({ ...f, goal, intensity: goal === "maintain" ? 0 : INTENSITY_RANGE[goal].default })),
    setTrainingStyle: (style: TrainingStyle) =>
      setForm((f) => ({
        ...f,
        trainingStyle: style,
        split: style === "strength" ? (f.split ?? "upperLower") : null,
        trainingDays: style === "sedentary" ? [] : f.trainingDays.length >= TRAINING_DAYS_RANGE.min ? f.trainingDays : DEFAULT_DAYS[3],
        cycling: style === "sedentary" ? false : f.cycling,
      })),
    setSplit: (split: StrengthSplit) => set("split", split),
    setFrequency: (count: number) => set("trainingDays", DEFAULT_DAYS[count] ?? DEFAULT_DAYS[3]),
    toggleDay: (day: number) =>
      setForm((f) => {
        if (f.trainingDays.includes(day)) return { ...f, trainingDays: f.trainingDays.filter((d) => d !== day) };
        if (f.trainingDays.length >= TRAINING_DAYS_RANGE.max) return f;
        return { ...f, trainingDays: [...f.trainingDays, day].sort((a, b) => a - b) };
      }),
    setDietStyle: (style: DietStyle) => set("dietStyle", style),
    setMealPattern: (pattern: MealPattern) => set("mealPattern", pattern),
    next: () => {
      if (!stepValid[step]) return;
      setDirection("forward");
      setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
    },
    back: () => {
      setDirection("back");
      setStep((s) => Math.max(0, s - 1));
    },
    goTo: (target: number) => {
      // Only jump back, or forward over steps that are already valid.
      if (target > step && !stepValid.slice(0, target).every(Boolean)) return;
      setDirection(target < step ? "back" : "forward");
      setStep(target);
    },
  };
}
