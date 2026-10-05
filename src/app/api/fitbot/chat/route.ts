import { getCurrentUser } from "@/server/auth";
import { FitbotError, MAX_CHARS, MAX_MESSAGES, runFitbotChat } from "@/server/fitbot/chat";
import { apiError, readJson } from "@/server/http";
import { chatMessageSchema } from "@/types/fitbot";
import { z } from "@/types/zod";

const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema.extend({ content: z.string().trim().min(1).transform((c) => c.slice(0, MAX_CHARS)) }))
    .min(1)
    .refine((m) => m[m.length - 1].role === "user", { message: "Son mesaj kullanıcıdan olmalı" })
    // Keep the prompt small: only the most recent turns are sent to the model.
    .transform((m) => m.slice(-MAX_MESSAGES)),
  context: z.unknown().optional(),
});

/**
 * POST /api/fitbot/chat `{ messages, context? }` -> `{ reply, sources }`. `context` is a
 * FitBotClientContext (re-validated on the server); signed-in users also get today's meals.
 * 503 if Ollama isn't running, 502 if it answers with an error, 504 on timeout.
 */
export async function POST(request: Request) {
  const body = await readJson(request, chatRequestSchema);
  if (!body.ok) return body.response;

  const user = await getCurrentUser();
  try {
    return Response.json(await runFitbotChat(body.data.messages, body.data.context, user?.id ?? null));
  } catch (err) {
    if (err instanceof FitbotError) return apiError(err.message, err.status);
    console.error("FitBot failed:", err);
    return apiError("FitBot şu anda yanıt veremiyor.", 500);
  }
}
