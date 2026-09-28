import { db } from "@/lib/db";
import { FITBOT_SYSTEM_PROMPT, type ChatMessage } from "@/lib/fitbot";
import { buildUserContext, parseClientContext } from "@/lib/fitbotContext";

const LLM_URL = (process.env.LOCAL_LLM_URL || "http://localhost:11434").replace(/\/+$/, "");
const LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3.2";

/** Small local models can be slow on first load (the model is read into memory). */
const TIMEOUT_MS = 120_000;
const MAX_MESSAGES = 20;
const MAX_CHARS = 2_000;

const UNREACHABLE = "Couldn't reach the local LLM service. Make sure it's running (ollama serve).";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function parseMessages(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const m of raw) {
    const { role, content } = (m ?? {}) as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null;
    messages.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  if (messages[messages.length - 1].role !== "user") return null;
  // Keep the prompt small: only the most recent turns are sent to the model.
  return messages.slice(-MAX_MESSAGES);
}

/**
 * The system prompt plus, when the client sent a valid `context`, the user's profile, targets and
 * today's meals (read fresh from the DB). Without it FitBot still works, just without personal data.
 */
async function systemPrompt(rawContext: unknown): Promise<string> {
  const ctx = parseClientContext(rawContext);
  if (!ctx) return FITBOT_SYSTEM_PROMPT;
  try {
    const meals = await db.meal.findMany({
      where: { createdAt: { gte: ctx.dayStart, lt: ctx.dayEnd } },
      select: { name: true, calories: true, protein: true, carbs: true, fat: true, createdAt: true },
    });
    return `${FITBOT_SYSTEM_PROMPT}\n\n${buildUserContext(ctx, meals)}`;
  } catch (err) {
    // Without the meal log the summary would be wrong ("nothing eaten"), so leave it out entirely.
    console.error("FitBot: couldn't load today's meals for context:", err);
    return FITBOT_SYSTEM_PROMPT;
  }
}

/**
 * POST /api/fitbot/chat — `{ messages: [{ role: "user" | "assistant", content }], context? }`, last
 * message from the user; `context` is a `FitBotClientContext`. Forwards the conversation plus
 * FitBot's system prompt (with the user's data, if any) to a local Ollama server
 * (`/api/chat`, non-streaming) and returns `{ reply }`. 503 if the server isn't running,
 * 502 if it answers with an error (e.g. the model hasn't been pulled).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Expected a JSON body", 400);
  }
  const messages = parseMessages(body);
  if (!messages) return error("`messages` must be a non-empty list ending with a user message", 400);

  const system = await systemPrompt((body as { context?: unknown }).context);

  let res: Response;
  try {
    res = await fetch(`${LLM_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: false,
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    console.error("FitBot: local LLM request failed:", err);
    return timedOut ? error("The local LLM took too long to answer. Please try again.", 504) : error(UNREACHABLE, 503);
  }

  const json = (await res.json().catch(() => null)) as { message?: { content?: unknown }; error?: unknown } | null;
  if (!res.ok) {
    const detail = typeof json?.error === "string" ? json.error : `HTTP ${res.status}`;
    console.error("FitBot: local LLM returned an error:", detail);
    if (res.status === 404 && /model/i.test(detail)) {
      return error(`Model "${LLM_MODEL}" isn't installed. Run: ollama pull ${LLM_MODEL}`, 502);
    }
    return error(`The local LLM returned an error: ${detail}`, 502);
  }

  const reply = typeof json?.message?.content === "string" ? json.message.content.trim() : "";
  if (!reply) return error("The local LLM returned an empty reply. Please try again.", 502);
  return Response.json({ reply });
}
