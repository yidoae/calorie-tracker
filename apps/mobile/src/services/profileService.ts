import { onboardingSchema, type OnboardingInput } from "@calorie/core/schemas/onboarding";
import { profileRowSchema, type Profile } from "@calorie/core/schemas/rows";
import { toAppError } from "./errors";
import { supabase } from "./supabase";

export type { Profile };

/** The signed-in user's profile (created by the database when the account was made). */
export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw toAppError(error);
  return profileRowSchema.parse(data);
}

/** Setup answers given so far: any subset of the first-time setup's questions. */
export type SetupAnswers = Partial<Omit<OnboardingInput, "fatPerKg" | "timeZone">>;

const setupAnswersSchema = onboardingSchema.omit({ fatPerKg: true, timeZone: true }).partial();

/**
 * Saves setup answers to the profile as soon as their step is done, so an interrupted setup resumes
 * where it stopped (FR-006). Writes only columns the user may update; `onboarding_completed` is set
 * by complete_onboarding alone. The age is stored as a birth year (this year − age), as
 * complete_onboarding does. Returns the updated profile.
 */
export async function saveSetupAnswers(userId: string, answers: SetupAnswers): Promise<Profile> {
  const a = setupAnswersSchema.parse(answers);
  // Unanswered fields stay undefined and are left out of the update.
  const columns = {
    sex: a.sex,
    birth_year: a.age === undefined ? undefined : new Date().getFullYear() - a.age,
    height_cm: a.heightCm,
    weight_kg: a.weightKg,
    goal_weight_kg: a.targetWeightKg,
    activity_level: a.activity,
    diet_style: a.dietStyle,
  };
  const { data, error } = await supabase.from("profiles").update(columns).eq("id", userId).select("*").single();
  if (error) throw toAppError(error);
  return profileRowSchema.parse(data);
}

/** Remembers that the user read the 16:8 / large-deficit notice, so it is not shown again (FR-010). */
export async function acknowledgeSensitiveWarning(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").update({ sensitive_warning_ack: true }).eq("id", userId).select("*").single();
  if (error) throw toAppError(error);
  return profileRowSchema.parse(data);
}
