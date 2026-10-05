import { deleteAccount } from "@/server/accounts";
import { endSession, getCurrentUser } from "@/server/auth";
import { apiError, readJson, unauthorized } from "@/server/http";
import { rateLimited } from "@/server/rateLimit";
import { deleteAccountSchema } from "@/types/account";

/** DELETE /api/me { password }: deletes the account and all of its data, then signs out. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (rateLimited(`delete-account:${user.id}`, 5, 15 * 60 * 1000)) {
    return apiError("Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.", 429);
  }
  const body = await readJson(request, deleteAccountSchema);
  if (!body.ok) return body.response;

  if (!(await deleteAccount(user.id, body.data.password))) return apiError("Şifre yanlış.", 403);
  await endSession();
  return new Response(null, { status: 204 });
}
