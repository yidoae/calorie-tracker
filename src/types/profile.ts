import { z } from "./zod";

export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVEL_KEYS = ["sedentary", "light", "moderate", "active", "veryActive"] as const;
export const PACE_LEVEL_KEYS = ["slow", "moderate", "aggressive"] as const;
export const TRAINING_TYPE_KEYS = ["strength", "hypertrophy", "cardio", "rest"] as const;

export type Gender = (typeof GENDERS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVEL_KEYS)[number];
export type PaceLevel = (typeof PACE_LEVEL_KEYS)[number];
export type TrainingType = (typeof TRAINING_TYPE_KEYS)[number];
export type GoalDirection = "cut" | "bulk" | "maintain";

/** Accepted ranges (inclusive). Mifflin-St Jeor is validated for adults. */
export const PROFILE_LIMITS = {
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  age: { min: 15, max: 100 },
} as const;

export function inRange(field: keyof typeof PROFILE_LIMITS, value: number): boolean {
  const { min, max } = PROFILE_LIMITS[field];
  return Number.isFinite(value) && value >= min && value <= max;
}

const limited = (field: keyof typeof PROFILE_LIMITS) =>
  z.number().min(PROFILE_LIMITS[field].min).max(PROFILE_LIMITS[field].max);

/** A saved plan: body data plus goal. Targets are derived from it (lib/nutrition/energy.ts). */
export const profileSchema = z.object({
  id: z.string().min(1).max(64),
  /** User-facing name for this saved plan, e.g. "Yaz diyeti". */
  label: z.string().max(60),
  gender: z.enum(GENDERS),
  heightCm: limited("heightCm"),
  weightKg: limited("weightKg"),
  age: limited("age"),
  activity: z.enum(ACTIVITY_LEVEL_KEYS),
  /** Goal bodyweight in kg, or `null` to maintain the current weight. */
  targetWeightKg: limited("weightKg").nullable(),
  paceGoal: z.enum(PACE_LEVEL_KEYS),
  trainingType: z.enum(TRAINING_TYPE_KEYS),
});
export type Profile = z.infer<typeof profileSchema>;

export const CALORIE_LIMITS = { min: 800, max: 8000 } as const;

/** A user-authored set of daily targets that overrides the profile's calculated ones. */
export const customPlanSchema = z.object({
  calories: z.number().min(CALORIE_LIMITS.min).max(CALORIE_LIMITS.max),
  minProtein: z.number().positive().max(1000),
  carbs: z.number().positive().max(2000),
  fat: z.number().positive().max(1000),
  active: z.boolean(),
});
export type CustomPlan = z.infer<typeof customPlanSchema>;

/** Parses untrusted input into a Profile, or null. */
export const parseProfile = (raw: unknown): Profile | null => profileSchema.safeParse(raw).data ?? null;
export const parseCustomPlan = (raw: unknown): CustomPlan | null => customPlanSchema.safeParse(raw).data ?? null;
