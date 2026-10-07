import { foodCategorySchema, macrosSchema, microsSchema } from "./nutrition";
import { z } from "./zod";

/** EAN-8, UPC-A, EAN-13 and GTIN-14 are 8–14 digits. */
export const barcodeSchema = z.string().regex(/^\d{8,14}$/, "Barkod 8–14 haneli bir sayı olmalı");

/** A packaged product looked up by barcode (Open Food Facts), normalised to our food shape. */
export const foodProductSchema = z.object({
  barcode: barcodeSchema,
  name: z.string().min(1).max(80),
  brand: z.string().max(80).nullable(),
  category: foodCategorySchema,
  per100g: macrosSchema,
  micros: microsSchema,
  /** Grams in one serving as printed on the pack, if known. */
  servingGrams: z.number().positive().max(2000).nullable(),
});
export type FoodProduct = z.infer<typeof foodProductSchema>;

const grams100 = z.number().min(0).max(100);

/** Per-100 g nutrition as printed on a pack: energy can't exceed pure fat, no macro exceeds 100 g. */
export const labelMacrosSchema = z
  .object({ calories: z.number().min(0).max(900), protein: grams100, carbs: grams100, fat: grams100 })
  .refine((m) => m.protein + m.carbs + m.fat <= 100.5, "Protein, karbonhidrat ve yağ toplamı 100 g'ı geçemez");

/** A food the user entered (by hand or from a label photo). */
export const customFoodInputSchema = z.object({
  name: z.string().trim().min(1, "Ürün adını yaz").max(80),
  brand: z.string().trim().max(80).nullable(),
  per100g: labelMacrosSchema,
  micros: z.object({
    fiber: grams100.optional(),
    sugar: grams100.optional(),
    satFat: grams100.optional(),
    sodium: z.number().min(0).max(40_000).optional(),
  }),
  servingGrams: z.number().positive().max(2000).nullable(),
});
export type CustomFoodInput = z.infer<typeof customFoodInputSchema>;

export const customFoodSchema = customFoodInputSchema.extend({
  id: z.string(),
  category: foodCategorySchema,
  createdAt: z.string(),
});
export type CustomFood = z.infer<typeof customFoodSchema>;
export const customFoodListSchema = z.array(customFoodSchema);

/** Per-100 g values read from a nutrition label photo; null = couldn't be read. */
const read = z.number().min(0).max(100_000).nullable();
export const labelReadSchema = z.object({
  values: z.object({
    calories: read,
    protein: read,
    carbs: read,
    fat: read,
    fiber: read,
    sugar: read,
    satFat: read,
    sodium: read,
    servingGrams: read,
  }),
  /** Product name, when a vision model could read it. */
  name: z.string().max(80).nullable(),
  /** "vision": a local vision model read the table; "ocr": text recognition + label parser. */
  method: z.enum(["vision", "ocr"]),
});
export type LabelRead = z.infer<typeof labelReadSchema>;
