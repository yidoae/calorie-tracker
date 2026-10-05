import { DIET_STYLES, FAT_PER_KG_RANGE } from "./plan";
import { ACTIVITY_LEVEL_KEYS, GENDERS, PROFILE_LIMITS } from "./profile";
import { z } from "./zod";

const limited = (field: keyof typeof PROFILE_LIMITS) => z.number().min(PROFILE_LIMITS[field].min).max(PROFILE_LIMITS[field].max);

/** The first-time setup (/baslangic): body data, goal weight, activity and diet preference. */
export const onboardingSchema = z.object({
  age: limited("age"),
  sex: z.enum(GENDERS),
  heightCm: limited("heightCm"),
  weightKg: limited("weightKg"),
  targetWeightKg: limited("weightKg"),
  activity: z.enum(ACTIVITY_LEVEL_KEYS),
  dietStyle: z.enum(DIET_STYLES),
  fatPerKg: z.number().min(FAT_PER_KG_RANGE.min).max(FAT_PER_KG_RANGE.max),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
