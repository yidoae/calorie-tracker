import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized, validate } from "@/server/http";
import { createMeal, listMeals } from "@/server/meals/repository";
import { deleteImage, imageProblem, saveImage } from "@/server/storage";
import { createMealSchema, dateRangeSchema } from "@/types/meal";

/**
 * GET /api/meals?from=<ISO>&to=<ISO>: the user's meals with from <= createdAt < to, newest first,
 * each with its items. The client passes its own local-day (or month) boundaries so "today"
 * follows the user's timezone, not the server's.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const range = validate(dateRangeSchema, { from: params.get("from"), to: params.get("to") });
  if (!range.ok) return range.response;

  return Response.json(await listMeals(user.id, new Date(range.data.from), new Date(range.data.to)));
}

/**
 * POST /api/meals: logs a meal.
 * - Photo meals: multipart form with `image` and `meal` (JSON `{ name, items }` as reviewed by the user).
 * - Quick-bar meals: a JSON body `{ name, items }`.
 * Totals are computed on the server from the items.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const isMultipart = request.headers.get("content-type")?.startsWith("multipart/form-data") ?? false;
  let raw: unknown;
  let image: File | null = null;
  try {
    if (isMultipart) {
      const form = await request.formData();
      const problem = imageProblem(form.get("image"));
      if (problem) return apiError(problem.message, problem.status);
      image = form.get("image") as File;
      raw = JSON.parse(String(form.get("meal") ?? "null"));
    } else {
      raw = await request.json();
    }
  } catch {
    return apiError("İstek okunamadı: `meal` alanı geçerli JSON olmalı", 400);
  }

  const input = validate(createMealSchema, raw);
  if (!input.ok) return input.response;

  const imageUrl = image ? await saveImage(Buffer.from(await image.arrayBuffer()), image.type) : null;
  try {
    return Response.json(await createMeal(user.id, input.data, imageUrl), { status: 201 });
  } catch (err) {
    await deleteImage(imageUrl); // don't orphan the file if the insert failed
    console.error("Failed to save meal:", err);
    return apiError("Öğün kaydedilemedi", 500);
  }
}
