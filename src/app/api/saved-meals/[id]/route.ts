import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { deleteSavedMeal } from "@/server/meals/repository";

/** DELETE /api/saved-meals/:id: removes one of the user's meal templates. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/saved-meals/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!(await deleteSavedMeal(user.id, id))) return apiError("Kayıtlı öğün bulunamadı", 404);
  return new Response(null, { status: 204 });
}
