import {
  customFoodListSchema,
  customFoodSchema,
  foodProductSchema,
  labelReadSchema,
  type CustomFood,
  type CustomFoodInput,
  type FoodProduct,
  type LabelRead,
} from "@/types/food";
import { request } from "./http";

/** Food lookups (/api/foods/*). */
export const foodService = {
  /** A packaged product by barcode. Throws ApiError 404 if it isn't in the database. */
  byBarcode(barcode: string): Promise<FoodProduct> {
    return request(`/api/foods/barcode/${encodeURIComponent(barcode)}`, foodProductSchema);
  },

  /** The user's own foods. */
  listCustom(): Promise<CustomFood[]> {
    return request("/api/foods/custom", customFoodListSchema);
  },

  createCustom(food: CustomFoodInput): Promise<CustomFood> {
    return request("/api/foods/custom", customFoodSchema, { json: food });
  },

  removeCustom(id: string): Promise<void> {
    return request(`/api/foods/custom/${encodeURIComponent(id)}`, null, { method: "DELETE" });
  },

  /** Reads a nutrition label photo. Throws ApiError 422 if nothing could be read. */
  readLabel(image: Blob): Promise<LabelRead> {
    const form = new FormData();
    form.append("image", image, image instanceof File ? image.name : "label.jpg");
    return request("/api/foods/label", labelReadSchema, { form });
  },
};
