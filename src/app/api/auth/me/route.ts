import { settingsOf } from "@/server/accounts";
import { getCurrentUser, toPublicUser } from "@/server/auth";

/** GET /api/auth/me: `{ user: null }` for guests, else the user and their saved settings. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null, settings: null });
  return Response.json({ user: toPublicUser(user), settings: settingsOf(user) });
}
