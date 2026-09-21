import type { Macros } from "./goals";

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";

export interface Profile {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  activity: ActivityLevel;
}

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; factor: number }> = {
  sedentary: { label: "Sedentary — desk job, little exercise", factor: 1.2 },
  light: { label: "Light — exercise 1–3 days/week", factor: 1.375 },
  moderate: { label: "Moderate — exercise 3–5 days/week", factor: 1.55 },
  active: { label: "Active — hard exercise 6–7 days/week", factor: 1.725 },
  veryActive: { label: "Very active — physical job or 2× training", factor: 1.9 },
};

/** Accepted ranges (inclusive). Mifflin-St Jeor is validated for adults. */
export const PROFILE_LIMITS = {
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  age: { min: 15, max: 100 },
} as const;

const PROTEIN_G_PER_KG = 1.6;
const FAT_SHARE_OF_CALORIES = 0.25;

export function inRange(field: keyof typeof PROFILE_LIMITS, value: number): boolean {
  const { min, max } = PROFILE_LIMITS[field];
  return Number.isFinite(value) && value >= min && value <= max;
}

export function isValidProfile(p: Profile): boolean {
  return (
    (p.gender === "male" || p.gender === "female") &&
    p.activity in ACTIVITY_LEVELS &&
    inRange("heightCm", p.heightCm) &&
    inRange("weightKg", p.weightKg) &&
    inRange("age", p.age)
  );
}

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

/**
 * Daily targets at maintenance calories: protein by body weight, fat as a share
 * of calories, carbohydrates fill the remainder.
 */
export function calculateTargets(p: Profile): Macros {
  const calories = Math.round(calculateTdee(p));
  const protein = Math.round(p.weightKg * PROTEIN_G_PER_KG);
  const fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

/** Parses a stored profile, returning null for anything missing or malformed. */
export function parseProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Profile;
    return isValidProfile(p)
      ? { gender: p.gender, heightCm: p.heightCm, weightKg: p.weightKg, age: p.age, activity: p.activity }
      : null;
  } catch {
    return null;
  }
}
