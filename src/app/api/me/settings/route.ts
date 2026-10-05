import { saveSettings } from "@/server/accounts";
import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { parseSettings } from "@/types/settings";

/** PUT /api/me/settings: replaces the signed-in user's saved profiles and custom plan. */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return apiError("Geçerli bir JSON gövdesi bekleniyordu", 400);

  // Lenient: malformed profiles are dropped rather than rejecting the whole save.
  const settings = parseSettings(body);
  await saveSettings(user.id, settings);
  return Response.json(settings);
}
