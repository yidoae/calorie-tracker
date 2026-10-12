import { gramsSchema, macrosSchema, mealItemSchema } from "./nutrition.ts";
import { z } from "./zod.ts";

/** Which meal of the day; drives grouping and the per-meal calorie targets. */
export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export const mealSlotSchema = z.enum(MEAL_SLOTS);
export type MealSlot = z.infer<typeof mealSlotSchema>;

/** A real calendar day as `YYYY-MM-DD` (2027-02-30 is rejected). */
export const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, "Geçersiz tarih");

/** An IANA time zone name from the device, e.g. `Europe/Istanbul`. */
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)*$/, "Geçersiz saat dilimi");

/** A logged meal as the app uses it; totals are computed by the database from the items (FR-015). */
export const mealSchema = z.object({
  id: z.uuid(),
  slot: mealSlotSchema,
  localDate: dayKeySchema,
  timeZone: timeZoneSchema,
  loggedAt: z.string(),
  name: z.string(),
  totals: macrosSchema,
  items: z.array(mealItemSchema.extend({ id: z.uuid(), position: z.number().int().min(0) })),
});
export type Meal = z.infer<typeof mealSchema>;

/** `log_meal` payload: only foods and grams; nutrition and totals come from the database. */
export const logMealPayloadSchema = z.object({
  slot: mealSlotSchema,
  localDate: dayKeySchema,
  timeZone: timeZoneSchema,
  name: z.string().trim().min(1).max(80),
  items: z
    .array(z.object({ foodId: z.string().min(1).max(64), grams: gramsSchema }))
    .min(1, "En az bir yemek ekle")
    .max(30, "Bir öğünde en fazla 30 yemek olabilir"),
});
export type LogMealPayload = z.infer<typeof logMealPayloadSchema>;
