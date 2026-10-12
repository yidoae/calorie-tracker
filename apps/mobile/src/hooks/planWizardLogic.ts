import { goalFromWeights } from "@calorie/core/nutrition/onboarding";
import { formulaPlan, weeklyChangeKg, weeksToGoal } from "@calorie/core/nutrition/plan";
import {
  INTENSITY_RANGE,
  planInputsSchema,
  targetWeightMatchesGoal,
  TRAINING_DAYS_RANGE,
  type MealPattern,
  type PlanGoal,
  type PlanInputs,
  type TrainingStyle,
} from "@calorie/core/schemas/plan";
import type { Profile } from "@calorie/core/schemas/rows";
import { ageFromBirthYear, formatNumber, numberFieldError, parseNumber } from "./setupSteps";

/*
 * The plan wizard (US4, FR-009, FR-010), ported from the web app's usePlanWizard: the form, its
 * per-step checks, the answer changes that move other answers along, the sensitive-content notice
 * rules and the live preview. Pure, so tests/planWizardLogic.test.ts runs it under node.
 */

export const WIZARD_STEPS = [
  { id: "body", title: "Vücut ve hedef" },
  { id: "training", title: "Antrenman" },
  { id: "diet", title: "Beslenme ve öğün düzeni" },
  { id: "advanced", title: "Kalori döngüsü" },
] as const;

/** A sensible weekday spread for N sessions (0 = Monday). */
const DEFAULT_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

/** A daily deficit from this size up shows the sensitive-content notice first (as does choosing 16:8). */
const SENSITIVE_DEFICIT_KCAL = 750;

export type SensitiveWarning = { kind: "fasting" } | { kind: "deficit"; value: number };

/** The form keeps number fields as typed text; everything else is already typed. */
export interface WizardForm extends Omit<PlanInputs, "heightCm" | "weightKg" | "age" | "targetWeightKg"> {
  heightCm: string;
  weightKg: string;
  age: string;
  targetWeightKg: string;
}

/**
 * The active plan's answers, or the setup answers when there is no plan. The sex always comes from
 * the profile: save_plan refuses a plan for another sex, because the calorie floor follows it.
 */
export function initialWizardForm(previous: PlanInputs | null, profile: Profile, year: number): WizardForm {
  const sex = profile.sex ?? previous?.sex ?? "female";
  if (previous) {
    return {
      ...previous,
      sex,
      heightCm: formatNumber(previous.heightCm),
      weightKg: formatNumber(previous.weightKg),
      age: String(previous.age),
      targetWeightKg: formatNumber(previous.targetWeightKg),
    };
  }
  const goal = profile.weightKg !== null && profile.goalWeightKg !== null ? goalFromWeights(profile.weightKg, profile.goalWeightKg) : "maintain";
  const age = ageFromBirthYear(profile.birthYear, year);
  return {
    sex,
    heightCm: formatNumber(profile.heightCm),
    weightKg: formatNumber(profile.weightKg),
    age: age === null ? "" : String(age),
    targetWeightKg: goal === "maintain" ? "" : formatNumber(profile.goalWeightKg),
    goal,
    intensity: goal === "maintain" ? 0 : INTENSITY_RANGE[goal].default,
    trainingStyle: "strength",
    split: "upperLower",
    trainingDays: DEFAULT_DAYS[4],
    dietStyle: profile.dietStyle ?? "highProtein",
    fatPerKg: profile.fatPerKg,
    mealPattern: "classic",
    fastingWindowStart: 12,
    cycling: false,
  };
}

interface WizardErrors {
  heightCm: string | null;
  weightKg: string | null;
  age: string | null;
  targetWeightKg: string | null;
  /** e.g. "kas kazanımı" with a goal weight below today's weight. */
  targetDirection: string | null;
  trainingDays: string | null;
}

/** Turkish reasons per field, which steps may be left, and the plan inputs once every answer is valid. */
export function checkWizard(form: WizardForm): { errors: WizardErrors; stepValid: boolean[]; inputs: PlanInputs | null } {
  const weight = parseNumber(form.weightKg);
  const target = form.targetWeightKg.trim() === "" ? null : parseNumber(form.targetWeightKg);
  const errors: WizardErrors = {
    heightCm: numberFieldError("heightCm", form.heightCm),
    weightKg: numberFieldError("weightKg", form.weightKg),
    age: numberFieldError("age", form.age),
    targetWeightKg: form.targetWeightKg.trim() === "" ? null : numberFieldError("targetWeightKg", form.targetWeightKg),
    targetDirection: null,
    trainingDays: null,
  };
  if (!errors.weightKg && !errors.targetWeightKg && weight !== null && !targetWeightMatchesGoal({ goal: form.goal, weightKg: weight, targetWeightKg: target })) {
    errors.targetDirection =
      form.goal === "cut" ? "Yağ yakımı için hedef kilon şu anki kilondan düşük olmalı." : "Kas kazanımı için hedef kilon şu anki kilondan yüksek olmalı.";
  }
  const days = form.trainingDays.length;
  if (form.trainingStyle !== "sedentary" && (days < TRAINING_DAYS_RANGE.min || days > TRAINING_DAYS_RANGE.max)) {
    errors.trainingDays = `Haftada ${TRAINING_DAYS_RANGE.min}–${TRAINING_DAYS_RANGE.max} gün seç.`;
  }

  const bodyValid = !errors.heightCm && !errors.weightKg && !errors.age && !errors.targetWeightKg && !errors.targetDirection;
  const stepValid = [bodyValid, !errors.trainingDays, true, true];
  const parsed = planInputsSchema.safeParse({
    ...form,
    heightCm: parseNumber(form.heightCm),
    weightKg: weight,
    age: parseNumber(form.age),
    targetWeightKg: target,
  });
  return { errors, stepValid, inputs: stepValid.every(Boolean) && parsed.success ? parsed.data : null };
}

/** Only jump back, or forward over steps that are already valid. */
export function canGoTo(step: number, target: number, stepValid: boolean[]): boolean {
  return target <= step || stepValid.slice(0, target).every(Boolean);
}

export function withGoal(form: WizardForm, goal: PlanGoal): WizardForm {
  return { ...form, goal, intensity: goal === "maintain" ? 0 : INTENSITY_RANGE[goal].default };
}

export function withTrainingStyle(form: WizardForm, style: TrainingStyle): WizardForm {
  return {
    ...form,
    trainingStyle: style,
    split: style === "strength" ? (form.split ?? "upperLower") : null,
    trainingDays: style === "sedentary" ? [] : form.trainingDays.length >= TRAINING_DAYS_RANGE.min ? form.trainingDays : DEFAULT_DAYS[3],
    cycling: style === "sedentary" ? false : form.cycling,
  };
}

export function withFrequency(form: WizardForm, count: number): WizardForm {
  return { ...form, trainingDays: DEFAULT_DAYS[count] ?? DEFAULT_DAYS[3] };
}

export function toggleTrainingDay(form: WizardForm, day: number): WizardForm {
  if (form.trainingDays.includes(day)) return { ...form, trainingDays: form.trainingDays.filter((d) => d !== day) };
  if (form.trainingDays.length >= TRAINING_DAYS_RANGE.max) return form;
  return { ...form, trainingDays: [...form.trainingDays, day].sort((a, b) => a - b) };
}

/** The notice to show before switching to 16:8, or null when the switch can happen at once. */
export function fastingNotice(form: WizardForm, pattern: MealPattern, acknowledged: boolean): SensitiveWarning | null {
  return pattern === "if168" && form.mealPattern !== "if168" && !acknowledged ? { kind: "fasting" } : null;
}

/** The notice to show before a deficit of 750 kcal or more, or null when it can be applied at once. */
export function deficitNotice(form: WizardForm, value: number, acknowledged: boolean): SensitiveWarning | null {
  return form.goal === "cut" && value >= SENSITIVE_DEFICIT_KCAL && !acknowledged ? { kind: "deficit", value } : null;
}

/** "Bana göre değil": a deficit that stays below the notice threshold. */
export function gentlerIntensity(form: WizardForm): number {
  return Math.min(form.intensity, SENSITIVE_DEFICIT_KCAL - INTENSITY_RANGE.cut.step);
}

/**
 * The live preview: the core formula, with the weekly change and the weeks to the goal weight
 * taken from the real daily change (the calorie floor can make it smaller than the chosen deficit).
 */
export function wizardPreview(inputs: PlanInputs) {
  const result = formulaPlan(inputs);
  const change = result.base.calories - result.tdee;
  return { ...result, weeklyChange: weeklyChangeKg(change), weeksToGoal: weeksToGoal(inputs, change) };
}
export type WizardPreview = ReturnType<typeof wizardPreview>;
