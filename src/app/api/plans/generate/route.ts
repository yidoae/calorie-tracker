import { getCurrentUser } from "@/server/auth";
import { readJson, unauthorized } from "@/server/http";
import { generatePlan } from "@/server/plans/generate";
import { planInputsSchema } from "@/types/plan";

/**
 * POST /api/plans/generate <PlanInputs> -> { plan, notice }: a draft nutrition plan (not saved).
 * Uses the local LLM when available, otherwise the Harris-Benedict fallback with a notice.
 */
export async function POST(request: Request) {
  if (!(await getCurrentUser())) return unauthorized();
  const inputs = await readJson(request, planInputsSchema);
  if (!inputs.ok) return inputs.response;
  return Response.json(await generatePlan(inputs.data));
}
