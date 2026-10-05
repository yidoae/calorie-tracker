import { getCurrentUser } from "@/server/auth";
import { FoodLookupError, lookupBarcode } from "@/server/food/openFoodFacts";
import { apiError, unauthorized, validate } from "@/server/http";
import { rateLimited } from "@/server/rateLimit";
import { barcodeSchema } from "@/types/food";

/** GET /api/foods/barcode/:code: a packaged product's nutrition from Open Food Facts (cached). */
export async function GET(_request: Request, ctx: RouteContext<"/api/foods/barcode/[code]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (rateLimited(`barcode:${user.id}`, 60, 60 * 1000)) return apiError("Çok fazla barkod sorgusu. Biraz bekleyip tekrar dene.", 429);

  const { code } = await ctx.params;
  const barcode = validate(barcodeSchema, code);
  if (!barcode.ok) return barcode.response;

  try {
    const product = await lookupBarcode(barcode.data);
    if (!product) return apiError("Bu barkod ürün veritabanında bulunamadı. Hızlı girişe yazarak ekleyebilirsin.", 404);
    return Response.json(product);
  } catch (err) {
    if (err instanceof FoodLookupError) return apiError(err.message, 503);
    throw err;
  }
}
