import { getCurrentUser } from "@/server/auth";
import { apiError, unauthorized } from "@/server/http";
import { imageProblem } from "@/server/storage";
import { NoFoodError, analyzeFoodImage } from "@/server/vision";

/**
 * POST /api/meals/analyze: multipart form with an `image` file. Runs the vision model and returns
 * a draft `{ name, items }` (the plate's components with grams) without saving anything. The user
 * adjusts portions and then POSTs the same image with the reviewed draft to /api/meals.
 * 422 when the photo isn't food.
 */
export async function POST(request: Request) {
  if (!(await getCurrentUser())) return unauthorized();

  let image: FormDataEntryValue | null;
  try {
    image = (await request.formData()).get("image");
  } catch {
    return apiError("Çok parçalı form verisi bekleniyordu", 400);
  }
  const problem = imageProblem(image);
  if (problem) return apiError(problem.message, problem.status);

  const file = image as File;
  try {
    return Response.json(await analyzeFoodImage({ data: Buffer.from(await file.arrayBuffer()), mimeType: file.type }));
  } catch (err) {
    if (err instanceof NoFoodError) {
      console.info(`No food detected (${err.reason})`);
      return apiError(err.message, 422);
    }
    console.error("Vision analysis failed:", err);
    return apiError("Bu fotoğraf analiz edilemedi — lütfen tekrar deneyin", 502);
  }
}
