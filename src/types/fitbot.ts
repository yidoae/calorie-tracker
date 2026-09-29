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
