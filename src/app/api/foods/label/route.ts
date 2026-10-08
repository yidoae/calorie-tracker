import { getCurrentUser } from "@/server/auth";
import { LabelReadError, readNutritionLabel } from "@/server/food/label";
import { apiError, unauthorized } from "@/server/http";
import { rateLimited } from "@/server/rateLimit";
import { imageProblem } from "@/server/storage";

/**
 * POST /api/foods/label: multipart form with an `image` of a pack's nutrition table. Returns the
 * per-100 g values it could read (nothing is saved); the user checks them before saving the food.
 * 422 when nothing could be read.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (rateLimited(`label:${user.id}`, 20, 10 * 60 * 1000)) return apiError("Çok fazla etiket okuttun. Birkaç dakika sonra tekrar dene.", 429);

  let image: FormDataEntryValue | null;
  try {
    image = (await request.formData()).get("image");
  } catch {
    return apiError("Çok parçalı form verisi bekleniyordu", 400);
  }
  const problem = imageProblem(image);
  if (problem) return apiError(problem.message, problem.status);

  try {
    return Response.json(await readNutritionLabel(Buffer.from(await (image as File).arrayBuffer())));
  } catch (err) {
    if (err instanceof LabelReadError) return apiError(err.message, 422);
    console.error("Label reading failed:", err);
    return apiError("Etiket okunamadı. Değerleri elle girebilirsin.", 502);
  }
}
