import { generatePlanResponseSchema, type GeneratePlanResponse, type PlanInputs } from "@/types/plan";
import { request } from "./http";

/** Nutrition-plan endpoints. Saving a plan goes through authService.saveSettings. */
export const planService = {
  generate(inputs: PlanInputs): Promise<GeneratePlanResponse> {
    return request("/api/plans/generate", generatePlanResponseSchema, { json: inputs });
  },
};
