import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { deleteWater } from "@/server/tracking/repository";

/** DELETE /api/water/:id: undoes a drink. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/water/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!(await deleteWater(user.id, id))) return apiError("Kayıt bulunamadı", 404);
  return new Response(null, { status: 204 });
}
