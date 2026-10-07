import { getCurrentUser } from "@/server/auth";
import { MAX_CUSTOM_FOODS, createCustomFood, listCustomFoods } from "@/server/food/customFoods";
import { apiError, readJson, unauthorized } from "@/server/http";
import { customFoodInputSchema } from "@/types/food";

/** GET /api/foods/custom: the user's own foods, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await listCustomFoods(user.id));
}

/** POST /api/foods/custom { name, brand, per100g, micros, servingGrams }: saves a food. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request, customFoodInputSchema);
  if (!body.ok) return body.response;

  const food = await createCustomFood(user.id, body.data);
  if (food === "limit") return apiError(`En fazla ${MAX_CUSTOM_FOODS} ürün kaydedebilirsin. Önce birini sil.`, 409);
  return Response.json(food, { status: 201 });
}
