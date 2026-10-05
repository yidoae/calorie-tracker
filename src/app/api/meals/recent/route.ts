import { getCurrentUser } from "@/server/auth";
import { unauthorized } from "@/server/http";
import { listRecentMeals } from "@/server/meals/repository";

const LIMIT = 8;

/** GET /api/meals/recent: the user's latest distinct meals (by name), for one-tap re-logging. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await listRecentMeals(user.id, LIMIT));
}
