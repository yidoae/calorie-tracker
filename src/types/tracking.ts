import { z } from "./zod";

/** Body-weight and water logging. */

export const WEIGHT_LIMITS = { min: 30, max: 300 } as const;

/** Local calendar day, `YYYY-MM-DD`. */
export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG biçiminde olmalı");

export const weightEntrySchema = z.object({
  id: z.string(),
  day: dayKeySchema,
  kg: z.number(),
});
export type WeightEntry = z.infer<typeof weightEntrySchema>;
export const weightListSchema = z.array(weightEntrySchema);

/** POST /api/weights: one entry per day; logging a day again replaces it. */
export const logWeightSchema = z.object({
  day: dayKeySchema,
  kg: z.number().min(WEIGHT_LIMITS.min).max(WEIGHT_LIMITS.max),
});
export type LogWeightInput = z.infer<typeof logWeightSchema>;

export const waterEntrySchema = z.object({
  id: z.string(),
  ml: z.number().int(),
  createdAt: z.string(),
});
export type WaterEntry = z.infer<typeof waterEntrySchema>;
export const waterListSchema = z.array(waterEntrySchema);

export const logWaterSchema = z.object({ ml: z.number().int().min(50).max(2000) });
