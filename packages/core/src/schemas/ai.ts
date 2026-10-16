import { MAX_ITEM_GRAMS } from "./nutrition.ts";
import { z } from "./zod.ts";

/*
 * The `ai-log` Edge Function's request and response (specs/003-ai-logging/contracts/ai-log.md)
 * and the `ai_allowance()` row. The app parses every answer with these (constitution II); the
 * function checks the same bounds on its side.
 */

/** Longest meal description the app sends (FR-006). */
export const MAX_AI_TEXT = 300;

/** Most foods one analysis returns; the same as a meal's item limit. */
export const MAX_AI_ITEMS = 30;

export const aiLogRequestSchema = z.discriminatedUnion("kind", [
  z.object({ request_key: z.uuid(), kind: z.literal("photo"), image: z.string().min(1) }),
  z.object({ request_key: z.uuid(), kind: z.literal("text"), text: z.string().trim().min(1).max(MAX_AI_TEXT) }),
]);
export type AiLogRequest = z.infer<typeof aiLogRequestSchema>;

const allowanceSchema = z.object({
  used: z.number().int().min(0),
  limit: z.number().int().min(0),
  resets_at: z.iso.datetime({ offset: true }),
});

export const aiLogResponseSchema = z
  .object({
    items: z
      .array(z.object({ food_id: z.string().min(1), grams: z.number().positive().max(MAX_ITEM_GRAMS), estimated: z.boolean() }))
      .min(1)
      .max(MAX_AI_ITEMS),
    unmatched: z.array(z.object({ description: z.string().min(1).max(120), grams: z.number().positive().max(MAX_ITEM_GRAMS).optional() })),
    allowance: allowanceSchema,
  })
  .transform((r) => ({
    items: r.items.map((i) => ({ foodId: i.food_id, grams: i.grams, estimated: i.estimated })),
    unmatched: r.unmatched,
    allowance: { used: r.allowance.used, limit: r.allowance.limit, resetsAt: r.allowance.resets_at },
  }));
export type AiLogResult = z.output<typeof aiLogResponseSchema>;

export const AI_ERROR_CODES = ["invalid_request", "not_authenticated", "too_large", "bad_image", "no_food", "limit_reached", "ai_unavailable"] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export const aiErrorSchema = z.object({ error: z.enum(AI_ERROR_CODES), resets_at: z.iso.datetime({ offset: true }).optional() });

/** One row of `ai_allowance()`; Postgres timestamptz arrives as an ISO string. */
export const allowanceRowSchema = z
  .object({ used: z.number().int().min(0), limit: z.number().int().min(0), resets_at: z.string().min(1) })
  .transform((r) => ({ used: r.used, limit: r.limit, resetsAt: r.resets_at }));
export type Allowance = z.output<typeof allowanceRowSchema>;
