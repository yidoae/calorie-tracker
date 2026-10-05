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
