import { z } from "./zod.ts";

/** The four tracked quantities: energy (kcal) and the three macronutrients (g). */
export const MACRO_KEYS = ["calories", "protein", "carbs", "fat"] as const;
export type MacroKey = (typeof MACRO_KEYS)[number];

const amount = z.number().min(0).max(100_000);

export const macrosSchema = z.object({
  calories: amount,
  protein: amount,
  carbs: amount,
  fat: amount,
});
export type Macros = z.infer<typeof macrosSchema>;

/** A food's values per 100 g: at most 900 kcal (pure fat) and 100 g of any macro. */
export const per100gSchema = z.object({
  calories: z.number().min(0).max(900),
  protein: z.number().min(0).max(100),
  carbs: z.number().min(0).max(100),
  fat: z.number().min(0).max(100),
});

/** Most grams one meal item may have (FR-013); the database checks the same bound. */
export const MAX_ITEM_GRAMS = 5000;
export const gramsSchema = z.number().positive().max(MAX_ITEM_GRAMS);

/**
 * One food in a meal. Nutrition is per 100 g, copied from the food database when the item is
 * saved, so the portion can be rescaled with the same pure function (`itemMacros`).
 */
export const mealItemSchema = z.object({
  foodId: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  grams: gramsSchema,
  per100g: per100gSchema,
});
export type MealItem = z.infer<typeof mealItemSchema>;
