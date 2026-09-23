import { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";
import { NoFoodError, analyzeFoodImage } from "@/lib/vision";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * POST /api/meals/analyze — multipart form with an `image` file; runs the vision model
 * and returns a draft (name, estimated grams, macros) without saving anything. The
 * caller reviews/edits the draft and then POSTs the same image to /api/meals to log it.
 */
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

  try {
    const nutrition = await analyzeFoodImage({ data, mimeType: image.type });
    return Response.json(nutrition);
  } catch (err) {
    if (err instanceof NoFoodError) {
      console.info(`No food detected (${err.reason})`);
      return error(err.message, 422);
    }
    console.error("Vision analysis failed:", err);
    return error("Could not analyze this photo — please try again", 502);
  }
}
