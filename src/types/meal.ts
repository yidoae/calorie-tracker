import { z } from "./zod";
import { mealItemSchema } from "./nutrition";

/** A logged meal as sent over the wire (dates are ISO strings). */
export const mealSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  /** Plate components; empty for meals logged before breakdowns existed. */
  items: z.array(mealItemSchema),
});
export type MealDTO = z.infer<typeof mealSchema>;
export const mealListSchema = z.array(mealSchema);

/** What the client sends to log a meal (with a photo as multipart, or as JSON from the quick bar). */
export const createMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  items: z.array(mealItemSchema).min(1).max(30),
});
export type CreateMealInput = z.infer<typeof createMealSchema>;

/** The vision model's proposal for a photo, reviewed (and portion-adjusted) before it's logged. */
export const mealDraftSchema = createMealSchema;
export type MealDraft = z.infer<typeof mealDraftSchema>;

/** Quick bar: free text in, recognised items (plus whatever couldn't be matched) out. */
export const quickParseRequestSchema = z.object({
  text: z.string().trim().min(1).max(300),
});

export const quickParseResultSchema = z.object({
  name: z.string(),
  items: z.array(mealItemSchema),
  /** Fragments of the text that couldn't be matched to a food. */
  unmatched: z.array(z.string()),
  /** Fragments the local AI matched after the rule-based parser couldn't. */
  aiMatched: z.array(z.string()),
});
export type QuickParseResult = z.infer<typeof quickParseResultSchema>;

/** `from <= createdAt < to`, as ISO strings (the browser's local-day or month boundaries). */
export const dateRangeSchema = z
  .object({ from: z.iso.datetime({ offset: true }), to: z.iso.datetime({ offset: true }) })
  .refine((r) => new Date(r.from) < new Date(r.to), { message: "`from` `to`'dan önce olmalı" });
