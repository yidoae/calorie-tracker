import { nutritionPlanSchema } from "./plan.ts";
import type { z } from "./zod.ts";

/*
 * Payloads of the database functions (contracts/database-api.md) that no other schema covers.
 * `complete_onboarding` takes `onboardingSchema` answers plus a plan; `save_plan` takes a plan.
 */

/** A plan as `complete_onboarding` and `save_plan` take it: the database assigns `id` and `createdAt`, so parsing a built plan drops them. */
export const planPayloadSchema = nutritionPlanSchema.omit({ id: true, createdAt: true });
export type PlanPayload = z.infer<typeof planPayloadSchema>;
