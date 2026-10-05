import { getCurrentUser } from "@/server/auth";
import { apiError, readJson, unauthorized } from "@/server/http";
import { createSavedMeal, listSavedMeals } from "@/server/meals/repository";
import { createSavedMealSchema } from "@/types/meal";

/** GET /api/saved-meals: the user's meal templates, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await listSavedMeals(user.id));
}

/** POST /api/saved-meals { name, slot, items }: saves a meal template. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request, createSavedMealSchema);
  if (!body.ok) return body.response;

  const saved = await createSavedMeal(user.id, body.data);
  if (saved === "limit") return apiError("En fazla 50 kayıtlı öğün tutabilirsin. Önce birini sil.", 409);
  return Response.json(saved, { status: 201 });
}
