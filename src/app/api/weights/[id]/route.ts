import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { deleteWeight } from "@/server/tracking/repository";

/** DELETE /api/weights/:id */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/weights/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!(await deleteWeight(user.id, id))) return apiError("Kayıt bulunamadı", 404);
  return new Response(null, { status: 204 });
}
