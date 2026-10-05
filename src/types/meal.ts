import { z } from "./zod";
import { mealItemSchema } from "./nutrition";

/** Which meal of the day; drives grouping and the per-meal calorie targets. */
export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export const mealSlotSchema = z.enum(MEAL_SLOTS);
export type MealSlot = z.infer<typeof mealSlotSchema>;

/** A logged meal as sent over the wire (dates are ISO strings). */
export const mealSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  imageUrl: z.string().nullable(),
  slot: mealSlotSchema,
  createdAt: z.string(),
  /** Plate components; empty for meals logged before breakdowns existed. */
  items: z.array(mealItemSchema),
});
export type MealDTO = z.infer<typeof mealSchema>;
export const mealListSchema = z.array(mealSchema);

/** What the client sends to log a meal (with a photo as multipart, or as JSON from the quick bar). */
/** How far back / ahead an explicit log time may be (undo restores a meal at its original time). */
const LOGGED_AT_WINDOW_MS = { past: 400 * 24 * 60 * 60 * 1000, future: 5 * 60 * 1000 } as const;

export const createMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slot: mealSlotSchema,
  items: z.array(mealItemSchema).min(1).max(30),
  /** Optional original log time (ISO), e.g. when "Geri al" restores a deleted meal; default: now. */
  loggedAt: z.iso
    .datetime({ offset: true })
    .refine((v) => {
      const t = Date.parse(v);
      return t >= Date.now() - LOGGED_AT_WINDOW_MS.past && t <= Date.now() + LOGGED_AT_WINDOW_MS.future;
    }, "Geçersiz kayıt zamanı")
    .optional(),
});
export type CreateMealInput = z.infer<typeof createMealSchema>;

/** PATCH /api/meals/:id replaces the meal's name, slot and items (the photo stays). */
export const updateMealSchema = createMealSchema.omit({ loggedAt: true });
export type UpdateMealInput = CreateMealInput;

/** The vision model's (or a barcode's) proposal, reviewed and portion-adjusted before it's logged. */
export const mealDraftSchema = createMealSchema.omit({ slot: true, loggedAt: true });
export type MealDraft = z.infer<typeof mealDraftSchema>;

/** A reusable meal template ("Kayıtlı öğün"). */
export const savedMealSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: mealSlotSchema,
  items: z.array(mealItemSchema),
  createdAt: z.string(),
});
export type SavedMealDTO = z.infer<typeof savedMealSchema>;
export const savedMealListSchema = z.array(savedMealSchema);
export const createSavedMealSchema = createMealSchema.omit({ loggedAt: true });

/** Quick bar: free text in, recognised items (plus whatever couldn't be matched) out. */
export const quickParseRequestSchema = z.object({
  text: z.string().trim().min(1).max(300),
});

export const quickParseResultSchema = z.object({
  name: z.string(),
  /** Meal slot named in the text ("öğlen" -> lunch), if any. */
  slot: mealSlotSchema.nullable(),
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
