import { db } from "@/lib/db";
import { deleteImage, saveImage, ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";
import type { MealDTO } from "@/lib/types";
import { NoFoodError, analyzeFoodImage } from "@/lib/vision";
import type { Meal } from "@prisma/client";

function toDTO(meal: Meal): MealDTO {
  return { ...meal, createdAt: meal.createdAt.toISOString() };
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
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

/** POST /api/meals — multipart form with an `image` file; analyzes and logs the meal. */
export async function POST(request: Request) {
  let image: FormDataEntryValue | null;
  try {
    image = (await request.formData()).get("image");
  } catch {
    return error("Expected multipart form data", 400);
  }

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

  let nutrition;
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

  const imageUrl = await saveImage(data, image.type);
  try {
    const meal = await db.meal.create({ data: { ...nutrition, imageUrl } });
    return Response.json(toDTO(meal), { status: 201 });
  } catch (err) {
    await deleteImage(imageUrl); // don't orphan the file if the insert failed
    console.error("Failed to save meal:", err);
    return error("Could not save the meal", 500);
  }
}
