import {
  mealDraftSchema,
  mealListSchema,
  mealSchema,
  quickParseResultSchema,
  type CreateMealInput,
  type MealDTO,
  type MealDraft,
  type QuickParseResult,
} from "@/types/meal";
import { request } from "./http";

/** Meal endpoints (/api/meals/*). */
export const mealService = {
  /** The user's meals with `from <= createdAt < to`, newest first. */
  list(from: Date, to: Date): Promise<MealDTO[]> {
    const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return request(`/api/meals?${query}`, mealListSchema);
  },

  /** Vision analysis of a photo: dish name + components. Throws ApiError 422 if it isn't food. */
  analyze(image: Blob): Promise<MealDraft> {
    const form = new FormData();
    form.append("image", image, image instanceof File ? image.name : "capture.jpg");
    return request("/api/meals/analyze", mealDraftSchema, { form });
  },

  /** Logs a meal, with its photo if there is one. */
  create(meal: CreateMealInput, image?: Blob): Promise<MealDTO> {
    if (!image) return request("/api/meals", mealSchema, { json: meal });
    const form = new FormData();
    form.append("image", image, image instanceof File ? image.name : "capture.jpg");
    form.append("meal", JSON.stringify(meal));
    return request("/api/meals", mealSchema, { form });
  },

  /** Quick-bar parsing on the server (rule-based + local AI for the rest). */
  parse(text: string): Promise<QuickParseResult> {
    return request("/api/meals/parse", quickParseResultSchema, { json: { text } });
  },

  remove(id: string): Promise<void> {
    return request(`/api/meals/${encodeURIComponent(id)}`, null, { method: "DELETE" });
  },
};
