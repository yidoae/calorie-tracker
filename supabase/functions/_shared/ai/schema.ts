import type { FoodRef } from "./types.ts";

/**
 * The response schema for Gemini's `generationConfig.responseSchema` (OpenAPI subset). `food_id`
 * is an enum of our searchable food ids, so the model cannot answer with an id we do not have
 * (research.md §2); validate.ts checks everything again.
 */
export function responseSchema(foods: FoodRef[]) {
  return {
    type: "OBJECT",
    properties: {
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            food_id: { type: "STRING", enum: foods.map((f) => f.id) },
            grams: { type: "NUMBER" },
            estimated: { type: "BOOLEAN" },
          },
          required: ["food_id", "grams", "estimated"],
        },
      },
      unmatched: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { description: { type: "STRING" }, grams: { type: "NUMBER" } },
          required: ["description"],
        },
      },
    },
    required: ["items", "unmatched"],
  };
}
