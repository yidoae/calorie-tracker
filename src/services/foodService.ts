import { foodProductSchema, type FoodProduct } from "@/types/food";
import { request } from "./http";

/** Food lookups (/api/foods/*). */
export const foodService = {
  /** A packaged product by barcode. Throws ApiError 404 if it isn't in the database. */
  byBarcode(barcode: string): Promise<FoodProduct> {
    return request(`/api/foods/barcode/${encodeURIComponent(barcode)}`, foodProductSchema);
  },
};
