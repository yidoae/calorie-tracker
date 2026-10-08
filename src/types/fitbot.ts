import { z } from "./zod";
import type { CustomPlan, Profile } from "./profile";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** A knowledge-base excerpt a reply cites as [n]. */
export const fitbotSourceSchema = z.object({
  n: z.number(),
  title: z.string(),
  heading: z.string().nullable(),
  source: z.string(),
});
export type FitBotSource = z.infer<typeof fitbotSourceSchema>;

export const chatResponseSchema = z.object({
  reply: z.string(),
  sources: z.array(fitbotSourceSchema).default([]),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;

/**
 * One line of the streamed reply (`stream: true`, NDJSON): text as it's written, `reset` when the
 * text shown so far turned out to precede a tool call and should be cleared, then `done` with the
 * final reply (replaces the streamed text) or `error`.
 */
export const chatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string() }),
  z.object({ type: z.literal("reset") }),
  chatResponseSchema.extend({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;

/** What the chat widget sends alongside the messages. Everything is re-validated on the server. */
export interface FitBotClientContext {
  profile: Profile | null;
  customPlan: CustomPlan | null;
  /** The browser's local-day boundaries (ISO), so "today" follows the user's timezone. */
  dayStart: string;
  dayEnd: string;
  /** IANA timezone, e.g. "Europe/Istanbul", used to show meal times in the user's local time. */
  timeZone: string;
}
