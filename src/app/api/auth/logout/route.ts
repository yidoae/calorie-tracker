import { endSession } from "@/server/auth";

/** POST /api/auth/logout: deletes the session row and clears the cookie. */
export async function POST() {
  await endSession();
  return new Response(null, { status: 204 });
}
