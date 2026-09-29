import type { Macros } from "@/types/nutrition";
import {
  profileSchema,
  type ActivityLevel,
  type GoalDirection,
  type PaceLevel,
  type Profile,
  type TrainingType,
} from "@/types/profile";

/*
 * Energy math: BMI, BMR, TDEE and daily targets. Pure functions, no I/O — shared by the UI,
 * the API and FitBot's tools. The English `label`s below go into FitBot's prompt; the UI shows
 * the Turkish ones from lib/labels.ts.
 */

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; factor: number }> = {
  sedentary: { label: "Sedentary — desk job, little exercise", factor: 1.2 },
  light: { label: "Light — exercise 1–3 days/week", factor: 1.375 },
  moderate: { label: "Moderate — exercise 3–5 days/week", factor: 1.55 },
  active: { label: "Active — hard exercise 6–7 days/week", factor: 1.725 },
  veryActive: { label: "Very active — physical job or 2× training", factor: 1.9 },
};

/** Weekly rate of change: how aggressively the calorie target departs from maintenance. */
export const PACE_LEVELS: Record<PaceLevel, { label: string; cutKcal: number; bulkKcal: number }> = {
  slow: { label: "Slow (~0.25 kg/week)", cutKcal: 250, bulkKcal: 150 },
  moderate: { label: "Moderate (~0.5 kg/week)", cutKcal: 500, bulkKcal: 300 },
  aggressive: { label: "Aggressive (~0.75–1 kg/week)", cutKcal: 750, bulkKcal: 500 },
};

/** How training demand scales protein needs, in grams per kg of bodyweight. */
export const TRAINING_TYPES: Record<TrainingType, { label: string; proteinGPerKg: number }> = {
  strength: { label: "Strength training", proteinGPerKg: 1.8 },
  hypertrophy: { label: "Hypertrophy / bodybuilding", proteinGPerKg: 2.2 },
  cardio: { label: "Cardio-focused", proteinGPerKg: 1.6 },
  rest: { label: "Rest days / general activity", proteinGPerKg: 1.4 },
};

const FAT_SHARE_OF_CALORIES = 0.25;
const MIN_CALORIES = 1200;

export const isValidProfile = (p: unknown): p is Profile => profileSchema.safeParse(p).success;

/** WHO adult BMI categories: `max` is the exclusive upper bound. */
export const BMI_CATEGORIES = [
  { max: 18.5, label: "Underweight", tone: "sky" },
  { max: 25, label: "Normal", tone: "emerald" },
  { max: 30, label: "Overweight", tone: "amber" },
  { max: Infinity, label: "Obese", tone: "red" },
] as const;

export type BmiCategory = (typeof BMI_CATEGORIES)[number];

/** Body mass index (kg/m²), rounded to one decimal so the shown value and its category always agree. */
export function calculateBmi({ heightCm, weightKg }: Pick<Profile, "heightCm" | "weightKg">): number {
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  return BMI_CATEGORIES.find((c) => bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

/** Weights (kg) for this height that fall in the WHO "Normal" BMI range. */
export function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const m2 = (heightCm / 100) ** 2;
  return { min: Math.ceil(18.5 * m2), max: Math.floor(24.9 * m2) };
}

/** Basal metabolic rate in kcal/day (Mifflin-St Jeor). */
export function calculateBmr({ gender, heightCm, weightKg, age }: Profile): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "male" ? 5 : -161);
}

/** Total daily energy expenditure in kcal/day: BMR scaled by activity level. */
export function calculateTdee(p: Profile): number {
  return calculateBmr(p) * ACTIVITY_LEVELS[p.activity].factor;
}

/** Whether the target weight implies losing, gaining, or holding bodyweight. */
export function goalDirection(p: Pick<Profile, "weightKg" | "targetWeightKg">): GoalDirection {
  if (p.targetWeightKg == null) return "maintain";
  const diff = p.targetWeightKg - p.weightKg;
  if (diff <= -0.5) return "cut";
  if (diff >= 0.5) return "bulk";
  return "maintain";
}

/**
 * Daily targets: calories are TDEE adjusted for the goal's direction and pace,
 * protein scales with training demand (body weight × g/kg), fat is a share of
 * calories, and carbohydrates fill the remainder.
 */
export function calculateTargets(p: Profile): Macros {
  const tdee = calculateTdee(p);
  const direction = goalDirection(p);
  const pace = PACE_LEVELS[p.paceGoal];
  const adjustment = direction === "cut" ? -pace.cutKcal : direction === "bulk" ? pace.bulkKcal : 0;
  const calories = Math.max(MIN_CALORIES, Math.round(tdee + adjustment));
  const protein = Math.round(p.weightKg * TRAINING_TYPES[p.trainingType].proteinGPerKg);
  const fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}
