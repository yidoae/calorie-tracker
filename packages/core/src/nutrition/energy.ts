/* BMI and its WHO categories. Pure functions; the plan engine (plan.ts) owns BMR, TDEE and targets. */

/** WHO adult BMI categories: `max` is the exclusive upper bound; the UI labels come from lib/labels.ts. */
const BMI_CATEGORIES = [
  { max: 18.5, tone: "sky" },
  { max: 25, tone: "emerald" },
  { max: 30, tone: "amber" },
  { max: Infinity, tone: "red" },
] as const;

export type BmiCategory = (typeof BMI_CATEGORIES)[number];

/** Body mass index (kg/m²), rounded to one decimal so the shown value and its category always agree. */
export function calculateBmi({ heightCm, weightKg }: { heightCm: number; weightKg: number }): number {
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  return BMI_CATEGORIES.find((c) => bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}
