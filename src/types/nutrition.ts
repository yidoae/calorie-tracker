import { z } from "./zod";

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

/** Optional micronutrients, per 100 g like the macros. Sodium in mg, the rest in g. */
export const MICRO_KEYS = ["fiber", "sugar", "satFat", "sodium"] as const;
export type MicroKey = (typeof MICRO_KEYS)[number];

export const microsSchema = z.object({
  fiber: amount.optional(),
  sugar: amount.optional(),
  satFat: amount.optional(),
  sodium: amount.optional(),
});
export type Micros = z.infer<typeof microsSchema>;

/** What role a food plays on the plate; drives the chips and colours in the breakdown. */
export const FOOD_CATEGORIES = ["protein", "carb", "fat", "vegetable", "fruit", "dairy"] as const;
export const foodCategorySchema = z.enum(FOOD_CATEGORIES);
export type FoodCategory = z.infer<typeof foodCategorySchema>;

/**
 * One component of a meal: a food on a photographed plate or an item from the quick-entry bar.
 * Nutrition is stored per 100 g so the portion can be rescaled anywhere (slider, server) with the
 * same pure function (`itemMacros`).
 */
export const mealItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: foodCategorySchema,
  grams: z.number().positive().max(5000),
  per100g: macrosSchema,
  /** Fibre, sugar, saturated fat and sodium per 100 g, where known. */
  micros: microsSchema.optional(),
});
export type MealItem = z.infer<typeof mealItemSchema>;
