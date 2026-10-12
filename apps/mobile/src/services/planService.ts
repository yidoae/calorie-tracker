import { onboardingSchema, type OnboardingInput } from "@calorie/core/schemas/onboarding";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { planRowSchema, profileRowSchema, type Profile } from "@calorie/core/schemas/rows";
import { planPayloadSchema, type PlanPayload } from "@calorie/core/schemas/rpc";
import { toAppError } from "./errors";
import { supabase } from "./supabase";

/*
 * Plans are written only by the database functions (contracts/database-api.md); the app sends the
 * plan it built with the core engine and the database checks the floor and the macro sum.
 */

/**
 * Finishes the first-time setup: stores the answers and the plan built from them, and marks the
 * profile as set up, in one step. Returns the updated profile.
 */
export async function completeOnboarding(answers: OnboardingInput, plan: PlanPayload): Promise<Profile> {
  const { data, error } = await supabase.rpc("complete_onboarding", {
    answers: onboardingSchema.parse(answers),
    plan: planPayloadSchema.parse(plan),
  });
  if (error) throw toAppError(error);
  return profileRowSchema.parse(data);
}

/**
 * Makes the plan the active one (save_plan); the previous plan stays as history. The database
 * refuses a day below the calorie floor or macros that do not add up. Returns the stored plan.
 */
export async function savePlan(plan: PlanPayload): Promise<NutritionPlan> {
  const { data, error } = await supabase.rpc("save_plan", { plan: planPayloadSchema.parse(plan) });
  if (error) throw toAppError(error);
  return planRowSchema.parse(data);
}

/** The signed-in user's active plan; null if there is none (RLS limits the rows to the user's own). */
export async function getActivePlan(): Promise<NutritionPlan | null> {
  const { data, error } = await supabase.from("nutrition_plans").select("*").eq("is_active", true).maybeSingle();
  if (error) throw toAppError(error);
  return data === null ? null : planRowSchema.parse(data);
}
