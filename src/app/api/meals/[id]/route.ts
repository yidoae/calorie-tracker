import { getCurrentUser } from "@/server/auth";
import { apiError, readJson, unauthorized } from "@/server/http";
import { deleteMeal, updateMeal } from "@/server/meals/repository";
import { updateMealSchema } from "@/types/meal";

/** PATCH /api/meals/:id { name, slot, items }: edits the user's meal; totals are recomputed. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await readJson(request, updateMealSchema);
  if (!body.ok) return body.response;

  const meal = await updateMeal(user.id, id, body.data);
  if (!meal) return apiError("Öğün bulunamadı", 404);
  return Response.json(meal);
}

/** DELETE /api/meals/:id: removes the user's meal and its photo. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  // Someone else's meal answers 404 too, so ids can't be probed.
  if (!(await deleteMeal(user.id, id))) return apiError("Öğün bulunamadı", 404);
  return new Response(null, { status: 204 });
}
