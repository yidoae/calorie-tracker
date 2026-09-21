import { db } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

/** DELETE /api/meals/:id — removes the meal and its stored photo. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  const { id } = await ctx.params;

  const meal = await db.meal.findUnique({ where: { id } });
  if (!meal) return Response.json({ error: "Meal not found" }, { status: 404 });

  await db.meal.delete({ where: { id } });
  await deleteImage(meal.imageUrl);
  return new Response(null, { status: 204 });
}
