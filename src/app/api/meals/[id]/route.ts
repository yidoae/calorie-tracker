import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { deleteMeal } from "@/server/meals/repository";

/** DELETE /api/meals/:id: removes the user's meal and its photo. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  // Someone else's meal answers 404 too, so ids can't be probed.
  if (!(await deleteMeal(user.id, id))) return apiError("Öğün bulunamadı", 404);
  return new Response(null, { status: 204 });
}
