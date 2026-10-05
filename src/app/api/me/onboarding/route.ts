import { completeOnboarding } from "@/server/accounts";
import { getCurrentUser } from "@/server/auth";
import { readJson, unauthorized } from "@/server/http";
import { onboardingSchema } from "@/types/onboarding";

/** POST /api/me/onboarding: saves the first-time setup and the plan built from it; returns the settings. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request, onboardingSchema);
  if (!body.ok) return body.response;
  return Response.json(await completeOnboarding(user, body.data));
}
