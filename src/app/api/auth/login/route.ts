import { authenticate } from "@/server/accounts";
import { startSession, toPublicUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { clientIp, rateLimited } from "@/server/rateLimit";
import { credentialsSchema } from "@/types/auth";

const INVALID = "Kullanıcı adı veya şifre hatalı.";

/** POST /api/auth/login { username, password } */
export async function POST(request: Request) {
  // Malformed input gets the same answer as wrong credentials, so it doesn't hint at the username rules.
  const creds = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!creds.success) return apiError(INVALID, 401);

  if (
    rateLimited(`login:${clientIp(request)}`, 30, 15 * 60 * 1000) ||
    rateLimited(`login-user:${creds.data.username}`, 10, 15 * 60 * 1000)
  ) {
    return apiError("Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.", 429);
  }

  const user = await authenticate(creds.data);
  if (!user) return apiError(INVALID, 401);

  await startSession(user.id);
  return Response.json({ user: toPublicUser(user) });
}
