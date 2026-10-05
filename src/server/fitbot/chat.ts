import { db } from "@/server/db";
import { LLM_MODEL, LLM_URL, NUM_CTX } from "@/server/llm/config";
import type { ChatMessage, ChatResponse } from "@/types/fitbot";
import type { Profile } from "@/types/profile";
import { buildUserContext, parseClientContext } from "./context";
import { formatKnowledge, searchKnowledge, usedSources } from "./knowledge";
import { FITBOT_SYSTEM_PROMPT } from "./prompt";
import { FITBOT_TOOLS, isFitbotTool, runFitbotTool } from "./tools";

/** A failure with the HTTP status the API should answer with and a message for the user. */
export class FitbotError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FitbotError";
  }
}

/** Small local models can be slow on first load (the model is read into memory). Covers all tool rounds. */
const TIMEOUT_MS = 120_000;
export const MAX_MESSAGES = 20;
export const MAX_CHARS = 2_000;
/** Tool-call round trips before the model must answer in plain text. */
const MAX_TOOL_ROUNDS = 3;

const UNREACHABLE = "Yerel yapay zekâ servisine ulaşılamadı. Çalıştığından emin olun (ollama serve).";

interface ToolCall {
  function: { name: string; arguments?: unknown };
}

/** Ollama chat message, including the tool-calling fields. */
interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_name?: string;
}

/**
 * `{"name": "...", "parameters": {...}}` written into the reply text, as llama3.2 sometimes does
 * instead of a real tool call. Returns it as a tool call, or null if the reply is ordinary text.
 */
function parseTextToolCall(content: string): ToolCall | null {
  const text = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  if (!text.startsWith("{") || !text.endsWith("}")) return null;
  try {
    const json = JSON.parse(text) as { name?: unknown; parameters?: unknown; arguments?: unknown };
    return typeof json.name === "string" ? { function: { name: json.name, arguments: json.parameters ?? json.arguments ?? {} } } : null;
  } catch {
    // Malformed, but still clearly an attempted call rather than an answer: report it as an unknown tool.
    return /^\{\s*"name"\s*:/.test(text) ? { function: { name: "", arguments: {} } } : null;
  }
}


/**
 * The system prompt plus, when the client sent a valid `context`, the user's profile, targets and
 * today's meals (read fresh from the DB). Without it FitBot still works, just without personal data.
 * Also returns the profile, which the calculator tools use for defaults.
 */
async function loadContext(rawContext: unknown, userId: string | null): Promise<{ system: string; profile: Profile | null }> {
  const ctx = parseClientContext(rawContext);
  if (!ctx) return { system: FITBOT_SYSTEM_PROMPT, profile: null };
  // Signed-in users only see their own meals; guests can't log meals, so their log is empty.
  if (!userId) return { system: `${FITBOT_SYSTEM_PROMPT}\n\n${buildUserContext(ctx, [])}`, profile: ctx.profile };
  try {
    const meals = await db.meal.findMany({
      where: { userId, createdAt: { gte: ctx.dayStart, lt: ctx.dayEnd } },
      select: { name: true, calories: true, protein: true, carbs: true, fat: true, createdAt: true },
    });
    return { system: `${FITBOT_SYSTEM_PROMPT}\n\n${buildUserContext(ctx, meals)}`, profile: ctx.profile };
  } catch (err) {
    // Without the meal log the summary would be wrong ("nothing eaten"), so leave it out entirely.
    console.error("FitBot: couldn't load today's meals for context:", err);
    return { system: FITBOT_SYSTEM_PROMPT, profile: ctx.profile };
  }
}

type LlmResult = { ok: true; message: LlmMessage } | { ok: false; error: FitbotError; noToolSupport?: boolean };

async function callLlm(messages: LlmMessage[], withTools: boolean, signal: AbortSignal): Promise<LlmResult> {
  let res: Response;
  try {
    res = await fetch(`${LLM_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: false,
        messages,
        options: { num_ctx: NUM_CTX },
        ...(withTools ? { tools: FITBOT_TOOLS } : {}),
      }),
      signal,
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    console.error("FitBot: local LLM request failed:", err);
    return {
      ok: false,
      error: timedOut ? new FitbotError("Yerel yapay zekâ çok geç yanıt verdi. Lütfen tekrar deneyin.", 504) : new FitbotError(UNREACHABLE, 503),
    };
  }

  const json = (await res.json().catch(() => null)) as { message?: LlmMessage; error?: unknown } | null;
  if (!res.ok) {
    const detail = typeof json?.error === "string" ? json.error : `HTTP ${res.status}`;
    console.error("FitBot: local LLM returned an error:", detail);
    if (/does not support tools/i.test(detail)) return { ok: false, error: new FitbotError(detail, 502), noToolSupport: true };
    if (res.status === 404 && /model/i.test(detail)) {
      return { ok: false, error: new FitbotError(`"${LLM_MODEL}" modeli yüklü değil. Çalıştırın: ollama pull ${LLM_MODEL}`, 502) };
    }
    return { ok: false, error: new FitbotError(`Yerel yapay zekâ bir hata döndürdü: ${detail}`, 502) };
  }
  if (!json?.message) return { ok: false, error: new FitbotError("Yerel yapay zekâ beklenmeyen bir yanıt döndürdü.", 502) };
  return { ok: true, message: json.message };
}

/**
 * One FitBot turn. Sends the conversation plus FitBot's system prompt (with the user's data, if
 * any) to a local Ollama server (`/api/chat`, non-streaming), runs any calculator tools it asks
 * for, and returns the reply plus the knowledge-base excerpts it relied on. Relevant excerpts are
 * inserted just before the latest message. Throws `FitbotError` (503 server down, 502 model error,
 * 504 timeout).
 *
 * `messages` must be non-empty and end with a user message (the route validates this).
 */
export async function runFitbotChat(messages: ChatMessage[], rawContext: unknown, userId: string | null): Promise<ChatResponse> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const [{ system, profile }, knowledge] = await Promise.all([
    loadContext(rawContext, userId),
    // The last two user turns, so short follow-ups ("and for women?") still find the right topic.
    searchKnowledge(
      messages
        .filter((m) => m.role === "user")
        .slice(-2)
        .map((m) => m.content)
        .join("\n"),
      signal,
    ),
  ]);
  // Reference excerpts go right before the latest user message (see formatKnowledge).
  const conversation: LlmMessage[] = [
    { role: "system", content: system },
    ...messages.slice(0, -1),
    ...(knowledge.length > 0 ? [{ role: "system" as const, content: formatKnowledge(knowledge) }] : []),
    messages[messages.length - 1],
  ];
  let toolsEnabled = true;
  let nudgedToText = false;

  for (let round = 0; ; round++) {
    // On the last round, withhold the tools so the model has to answer with what it has.
    const withTools = toolsEnabled && round < MAX_TOOL_ROUNDS;
    const result = await callLlm(conversation, withTools, signal);
    if (!result.ok) {
      if (result.noToolSupport && withTools) {
        toolsEnabled = false; // e.g. LOCAL_LLM_MODEL points at a model without tool calling
        continue;
      }
      throw result.error;
    }

    const { message } = result;
    let calls = withTools ? (message.tool_calls ?? []) : [];
    // llama3.2 occasionally echoes its role label ("assistant\n\n…") at the start of the reply.
    const reply = (message.content ?? "").replace(/^\s*assistant\s*\n+/i, "").trim();

    if (calls.length === 0) {
      // Small models sometimes write a tool call as plain text instead of using tool_calls.
      const textCall = parseTextToolCall(reply);
      if (textCall && withTools && isFitbotTool(textCall.function.name)) {
        calls = [textCall];
      } else if (textCall) {
        if (nudgedToText) throw new FitbotError("Yerel yapay zekâ bir yanıt üretemedi. Sorunuzu farklı ifade edip tekrar deneyin.", 502);
        // A made-up tool: drop the tools and ask for plain sentences instead.
        nudgedToText = true;
        toolsEnabled = false;
        conversation.push({ role: "system", content: "Answer the user's last message directly in plain sentences. Do not output JSON or function calls." });
        continue;
      } else {
        if (!reply) throw new FitbotError("Yerel yapay zekâ boş yanıt döndürdü. Lütfen tekrar deneyin.", 502);
        return { reply, sources: usedSources(reply, knowledge) };
      }
    }

    conversation.push({ role: "assistant", content: message.content ?? "", tool_calls: calls });
    for (const call of calls) {
      const name = call.function?.name ?? "";
      const output = runFitbotTool(name, call.function?.arguments, profile);
      console.info(`FitBot tool ${name}(${JSON.stringify(call.function?.arguments ?? {})}) ->`, JSON.stringify(output));
      conversation.push({ role: "tool", tool_name: name, content: JSON.stringify(output) });
    }
  }
}
