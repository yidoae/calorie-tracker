import { DIET_STYLES, FAT_PER_KG_RANGE } from "./plan.ts";
import { timeZoneSchema } from "./meal.ts";
import { ACTIVITY_LEVEL_KEYS, GENDERS, PROFILE_LIMITS } from "./profile.ts";
import { z } from "./zod.ts";

const limited = (field: keyof typeof PROFILE_LIMITS) => z.number().min(PROFILE_LIMITS[field].min).max(PROFILE_LIMITS[field].max);

/** The first-time setup: body data, goal weight, activity, diet preference and the device time zone. */
export const onboardingSchema = z.object({
  /** Whole years: the profile stores a birth year (complete_onboarding). */
  age: limited("age").int(),
  sex: z.enum(GENDERS),
  heightCm: limited("heightCm"),
  weightKg: limited("weightKg"),
  targetWeightKg: limited("weightKg"),
  activity: z.enum(ACTIVITY_LEVEL_KEYS),
  dietStyle: z.enum(DIET_STYLES),
  fatPerKg: z.number().min(FAT_PER_KG_RANGE.min).max(FAT_PER_KG_RANGE.max),
  timeZone: timeZoneSchema,
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
