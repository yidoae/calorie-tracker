import { db } from "@/lib/db";
import { FITBOT_SYSTEM_PROMPT, type ChatMessage } from "@/lib/fitbot";
import { buildUserContext, parseClientContext } from "@/lib/fitbotContext";
import { FITBOT_TOOLS, isFitbotTool, runFitbotTool } from "@/lib/fitbotTools";
import type { Profile } from "@/lib/profile";

const LLM_URL = (process.env.LOCAL_LLM_URL || "http://localhost:11434").replace(/\/+$/, "");
const LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3.2";

/** Small local models can be slow on first load (the model is read into memory). Covers all tool rounds. */
const TIMEOUT_MS = 120_000;
const MAX_MESSAGES = 20;
const MAX_CHARS = 2_000;
/** Tool-call round trips before the model must answer in plain text. */
const MAX_TOOL_ROUNDS = 3;

const UNREACHABLE = "Couldn't reach the local LLM service. Make sure it's running (ollama serve).";

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
 * Also returns the profile, which the calculator tools use for defaults.
 */
async function loadContext(rawContext: unknown): Promise<{ system: string; profile: Profile | null }> {
  const ctx = parseClientContext(rawContext);
  if (!ctx) return { system: FITBOT_SYSTEM_PROMPT, profile: null };
  try {
    const meals = await db.meal.findMany({
      where: { createdAt: { gte: ctx.dayStart, lt: ctx.dayEnd } },
      select: { name: true, calories: true, protein: true, carbs: true, fat: true, createdAt: true },
    });
    return { system: `${FITBOT_SYSTEM_PROMPT}\n\n${buildUserContext(ctx, meals)}`, profile: ctx.profile };
  } catch (err) {
    // Without the meal log the summary would be wrong ("nothing eaten"), so leave it out entirely.
    console.error("FitBot: couldn't load today's meals for context:", err);
    return { system: FITBOT_SYSTEM_PROMPT, profile: ctx.profile };
  }
}

type LlmResult = { ok: true; message: LlmMessage } | { ok: false; response: Response; noToolSupport?: boolean };

async function callLlm(messages: LlmMessage[], withTools: boolean, signal: AbortSignal): Promise<LlmResult> {
  let res: Response;
  try {
    res = await fetch(`${LLM_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: LLM_MODEL, stream: false, messages, ...(withTools ? { tools: FITBOT_TOOLS } : {}) }),
      signal,
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    console.error("FitBot: local LLM request failed:", err);
    return {
      ok: false,
      response: timedOut ? error("The local LLM took too long to answer. Please try again.", 504) : error(UNREACHABLE, 503),
    };
  }

  const json = (await res.json().catch(() => null)) as { message?: LlmMessage; error?: unknown } | null;
  if (!res.ok) {
    const detail = typeof json?.error === "string" ? json.error : `HTTP ${res.status}`;
    console.error("FitBot: local LLM returned an error:", detail);
    if (/does not support tools/i.test(detail)) return { ok: false, response: error(detail, 502), noToolSupport: true };
    if (res.status === 404 && /model/i.test(detail)) {
      return { ok: false, response: error(`Model "${LLM_MODEL}" isn't installed. Run: ollama pull ${LLM_MODEL}`, 502) };
    }
    return { ok: false, response: error(`The local LLM returned an error: ${detail}`, 502) };
  }
  if (!json?.message) return { ok: false, response: error("The local LLM returned an unexpected response.", 502) };
  return { ok: true, message: json.message };
}

/**
 * POST /api/fitbot/chat — `{ messages: [{ role: "user" | "assistant", content }], context? }`, last
 * message from the user; `context` is a `FitBotClientContext`. Sends the conversation plus FitBot's
 * system prompt (with the user's data, if any) to a local Ollama server (`/api/chat`, non-streaming)
 * and runs any calculator tools it asks for, then returns `{ reply }`. 503 if the server isn't
 * running, 502 if it answers with an error (e.g. the model hasn't been pulled), 504 on timeout.
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

  const { system, profile } = await loadContext((body as { context?: unknown }).context);
  const conversation: LlmMessage[] = [{ role: "system", content: system }, ...messages];
  const signal = AbortSignal.timeout(TIMEOUT_MS);
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
      return result.response;
    }

    const { message } = result;
    let calls = withTools ? (message.tool_calls ?? []) : [];
    const reply = message.content?.trim() ?? "";

    if (calls.length === 0) {
      // Small models sometimes write a tool call as plain text instead of using tool_calls.
      const textCall = parseTextToolCall(reply);
      if (textCall && withTools && isFitbotTool(textCall.function.name)) {
        calls = [textCall];
      } else if (textCall) {
        if (nudgedToText) return error("The local LLM couldn't produce an answer. Please rephrase and try again.", 502);
        // A made-up tool: drop the tools and ask for plain sentences instead.
        nudgedToText = true;
        toolsEnabled = false;
        conversation.push({ role: "system", content: "Answer the user's last message directly in plain sentences. Do not output JSON or function calls." });
        continue;
      } else {
        if (!reply) return error("The local LLM returned an empty reply. Please try again.", 502);
        return Response.json({ reply });
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
