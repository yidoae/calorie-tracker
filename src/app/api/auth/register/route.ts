import { registerUser } from "@/server/accounts";
import { startSession, toPublicUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { clientIp, rateLimited } from "@/server/rateLimit";
import { credentialsSchema } from "@/types/auth";
import { parseSettings } from "@/types/settings";
import { z } from "@/types/zod";

const registerSchema = credentialsSchema.extend({ settings: z.unknown().optional() });

/**
 * POST /api/auth/register { username, password, settings? }: creates the account and signs it in.
 * `settings` lets a guest carry plans they built on this device into the new account.
 */
export async function POST(request: Request) {
  if (rateLimited(`register:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return apiError("Bu ağdan çok fazla kayıt denemesi yapıldı. Daha sonra tekrar deneyin.", 429);
  }
  const body = await readJson(request, registerSchema);
  if (!body.ok) return body.response;

  const { settings, ...creds } = body.data;
  const user = await registerUser(creds, parseSettings(settings));
  if (user === "taken") return apiError("Bu kullanıcı adı alınmış.", 409);

  await startSession(user.id);
  return Response.json({ user: toPublicUser(user) }, { status: 201 });
}
