import { getCurrentUser } from "@/server/auth";
import { deleteCustomFood } from "@/server/food/customFoods";
import { apiError, unauthorized } from "@/server/http";

/** DELETE /api/foods/custom/:id: removes one of the user's foods (logged meals keep their copy). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/foods/custom/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!(await deleteCustomFood(user.id, id))) return apiError("Ürün bulunamadı", 404);
  return new Response(null, { status: 204 });
}
