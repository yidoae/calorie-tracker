import { macrosSchema } from "./nutrition";
import { PROFILE_LIMITS } from "./profile";
import { z } from "./zod";

/*
 * The nutrition plan built by the plan wizard (/plan): the user's answers (`PlanInputs`) and the
 * resulting daily targets, optionally split into training and rest days (calorie cycling).
 */

export const PLAN_GOALS = ["cut", "maintain", "bulk"] as const;
export const TRAINING_STYLES = ["strength", "functional", "cardio", "sedentary"] as const;
export const STRENGTH_SPLITS = ["fullBody", "upperLower", "ppl"] as const;
export const DIET_STYLES = ["highProtein", "lowCarb", "keto", "iifym"] as const;
export const MEAL_PATTERNS = ["classic", "if168"] as const;

export type PlanGoal = (typeof PLAN_GOALS)[number];
export type TrainingStyle = (typeof TRAINING_STYLES)[number];
export type StrengthSplit = (typeof STRENGTH_SPLITS)[number];
export type DietStyle = (typeof DIET_STYLES)[number];
export type MealPattern = (typeof MEAL_PATTERNS)[number];

/** Calorie deficit (cut) / surplus (bulk) slider ranges, kcal per day. */
export const INTENSITY_RANGE = {
  cut: { min: 300, max: 800, step: 50, default: 500 },
  bulk: { min: 150, max: 500, step: 25, default: 250 },
} as const;

export const TRAINING_DAYS_RANGE = { min: 2, max: 6 } as const;

/** Protein is fixed per kg of body weight (high-protein engine, lib/nutrition/plan.ts). */
export const PROTEIN_PER_KG = 2.2;
/** Fat per kg of body weight: user-adjustable; carbs fill the remaining calories. */
export const FAT_PER_KG_RANGE = { min: 1, max: 1.5, step: 0.05, default: 1.2 } as const;

/** A target weight must point the same way as the goal: below today's weight to cut, above to bulk. */
export function targetWeightMatchesGoal(i: { goal: PlanGoal; weightKg: number; targetWeightKg: number | null }): boolean {
  if (i.targetWeightKg === null || i.goal === "maintain") return true;
  return i.goal === "cut" ? i.targetWeightKg < i.weightKg : i.targetWeightKg > i.weightKg;
}

const limited = (field: keyof typeof PROFILE_LIMITS) => z.number().min(PROFILE_LIMITS[field].min).max(PROFILE_LIMITS[field].max);

/** Everything the wizard asks. Weekdays are 0 = Monday … 6 = Sunday. */
export const planInputsSchema = z
  .object({
    sex: z.enum(["male", "female"]),
    heightCm: limited("heightCm"),
    weightKg: limited("weightKg"),
    age: limited("age"),
    /** Optional goal weight, only used for the "weeks to goal" estimate and FitBot. */
    targetWeightKg: limited("weightKg").nullable(),
    goal: z.enum(PLAN_GOALS),
    /** Daily deficit (cut) or surplus (bulk) in kcal; 0 for maintain. */
    intensity: z.number().min(0).max(INTENSITY_RANGE.cut.max),
    trainingStyle: z.enum(TRAINING_STYLES),
    split: z.enum(STRENGTH_SPLITS).nullable(),
    trainingDays: z.array(z.number().int().min(0).max(6)).max(7),
    dietStyle: z.enum(DIET_STYLES),
    /** Fat in g per kg of body weight (plans saved before this field existed read the default). */
    fatPerKg: z.number().min(FAT_PER_KG_RANGE.min).max(FAT_PER_KG_RANGE.max).default(FAT_PER_KG_RANGE.default),
    mealPattern: z.enum(MEAL_PATTERNS),
    /** First hour of the 8-hour eating window (16:8), e.g. 12 = 12:00–20:00. */
    fastingWindowStart: z.number().int().min(6).max(16),
    /** Calorie/carb cycling between training and rest days. */
    cycling: z.boolean(),
  })
  .refine((i) => new Set(i.trainingDays).size === i.trainingDays.length, { message: "Antrenman günleri tekrar edemez", path: ["trainingDays"] })
  .refine((i) => targetWeightMatchesGoal(i), { message: "Hedef kilo, seçtiğin hedefle uyumlu değil", path: ["targetWeightKg"] })
  .refine(
    (i) =>
      i.trainingStyle === "sedentary" ||
      (i.trainingDays.length >= TRAINING_DAYS_RANGE.min && i.trainingDays.length <= TRAINING_DAYS_RANGE.max),
    { message: `Haftada ${TRAINING_DAYS_RANGE.min}–${TRAINING_DAYS_RANGE.max} antrenman günü seç`, path: ["trainingDays"] },
  );
export type PlanInputs = z.infer<typeof planInputsSchema>;

export const dayTargetsSchema = macrosSchema;
export type DayTargets = z.infer<typeof dayTargetsSchema>;

export const nutritionPlanSchema = z.object({
  id: z.string().min(1).max(64),
  createdAt: z.string(),
  inputs: planInputsSchema,
  /** "ai": numbers and summary from the local LLM (validated); "formula": Harris-Benedict fallback. */
  source: z.enum(["ai", "formula"]),
  bmr: z.number().positive(),
  tdee: z.number().positive(),
  /** Targets for every day, or the weekly average when cycling. */
  base: dayTargetsSchema,
  /** Training/rest-day targets when calorie cycling is on. */
  cycle: z.object({ training: dayTargetsSchema, rest: dayTargetsSchema }).nullable(),
  strategySummary: z.string().max(1200),
});
export type NutritionPlan = z.infer<typeof nutritionPlanSchema>;

/** POST /api/plans/generate response: a draft plan (not saved yet) and, on fallback, a notice. */
export const generatePlanResponseSchema = z.object({
  plan: nutritionPlanSchema,
  notice: z.string().nullable(),
});
export type GeneratePlanResponse = z.infer<typeof generatePlanResponseSchema>;

/*
 * Plan periods ("dönemler"): a titled plan that applies between two dates, both included, e.g. a
 * Cut from November to mid-December, then a Bulk. Days outside every period use the main plan
 * (`UserSettings.nutritionPlan`). Periods never overlap.
 */

export const MAX_PLAN_PERIODS = 24;
export const PLAN_TITLE_MAX = 40;
/** Quick picks in the period dialog; any other title can be typed. */
export const PLAN_TITLE_SUGGESTIONS = ["Cut", "Bulk", "Koruma", "Mini cut", "Reverse diet"] as const;

/** A real calendar day as `YYYY-MM-DD` (2027-02-30 is rejected). */
export const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, "Geçersiz tarih");

export const planTitleSchema = z.string().trim().min(1).max(PLAN_TITLE_MAX);

export const planPeriodSchema = z
  .object({
    id: z.string().min(1).max(64),
    title: planTitleSchema,
    /** First and last day of the period, `YYYY-MM-DD`, both included. */
    start: dayKeySchema,
    end: dayKeySchema,
    plan: nutritionPlanSchema,
  })
  .refine((p) => p.start <= p.end, { message: "Bitiş tarihi başlangıçtan önce olamaz", path: ["end"] });
export type PlanPeriod = z.infer<typeof planPeriodSchema>;

/** An inclusive `YYYY-MM-DD` range. */
export interface DayRange {
  start: string;
  end: string;
}
