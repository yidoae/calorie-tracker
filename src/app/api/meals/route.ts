import { db } from "@/lib/db";
import { deleteImage, saveImage, ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";
import type { MealDTO } from "@/lib/types";
import { NoFoodError, analyzeFoodImage, normalize, type NutritionData } from "@/lib/vision";
import type { Meal } from "@prisma/client";

function toDTO(meal: Meal): MealDTO {
  return { ...meal, createdAt: meal.createdAt.toISOString() };
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Nutrition fields the client already reviewed/edited (via /api/meals/analyze),
 * sent alongside the image so it isn't re-analyzed. `null` if the form doesn't
 * carry a full set of them, in which case the image is analyzed as a fallback.
 */
function reviewedNutrition(form: FormData): NutritionData | null {
  const fields = ["name", "calories", "protein", "carbs", "fat"] as const;
  const raw = Object.fromEntries(fields.map((f) => [f, form.get(f)]));
  if (fields.some((f) => typeof raw[f] !== "string")) return null;
  try {
    return normalize({
      name: raw.name as string,
      calories: Number(raw.calories),
      protein: Number(raw.protein),
      carbs: Number(raw.carbs),
      fat: Number(raw.fat),
    });
  } catch {
    return null;
  }
}

/**
 * GET /api/meals?from=<ISO>&to=<ISO>
 * Meals with from <= createdAt < to, newest first. The client passes its own
 * local-day boundaries so "today" follows the user's timezone, not the server's.
 * Without params, defaults to the server's current day.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = params.has("from") ? new Date(params.get("from")!) : startOfDay;
  const to = params.has("to")
    ? new Date(params.get("to")!)
    : new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return error("`from` and `to` must be valid ISO dates", 400);
  }

  const meals = await db.meal.findMany({
    where: { createdAt: { gte: from, lt: to } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(meals.map(toDTO));
}

/**
 * POST /api/meals — multipart form with an `image` file, plus optionally the reviewed
 * `name`/`calories`/`protein`/`carbs`/`fat` fields from a prior /api/meals/analyze call.
 * Analyzes the image (if those fields aren't supplied) and logs the meal.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Expected multipart form data", 400);
  }

  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return error("Missing `image` file", 400);
  }
  if (!ALLOWED_MIME_TYPES.includes(image.type)) {
    return error("Unsupported image type — use JPEG, PNG, WebP or GIF", 415);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return error(`Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`, 413);
  }

  const data = Buffer.from(await image.arrayBuffer());

  let nutrition = reviewedNutrition(form);
  if (!nutrition) {
    try {
      nutrition = await analyzeFoodImage({ data, mimeType: image.type });
    } catch (err) {
      if (err instanceof NoFoodError) {
        // Not a failure: the photo just isn't a meal. Nothing is stored.
        console.info(`No food detected (${err.reason})`);
        return error(err.message, 422);
      }
      console.error("Vision analysis failed:", err);
      return error("Could not analyze this photo — please try again", 502);
    }
  }

  const imageUrl = await saveImage(data, image.type);
  try {
    const meal = await db.meal.create({
      data: {
        name: nutrition.name,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        imageUrl,
      },
    });
    return Response.json(toDTO(meal), { status: 201 });
  } catch (err) {
    await deleteImage(imageUrl); // don't orphan the file if the insert failed
    console.error("Failed to save meal:", err);
    return error("Could not save the meal", 500);
  }
}
