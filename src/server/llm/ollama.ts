import { LLM_MODEL, LLM_URL } from "./config";

interface ChatOptions {
  system: string;
  user: string;
  /** JSON schema the answer must follow (Ollama structured output); omit for plain text. */
  format?: object;
  /** Hard cap on generated tokens, so a small model can't ramble. */
  maxTokens: number;
  temperature?: number;
  timeoutMs: number;
}

/**
 * One non-streaming chat call to the local Ollama server. Returns the answer text, or null if the
 * server is down, errors or times out; callers treat null as "AI unavailable" and fall back.
 */
export async function ollamaChat({ system, user, format, maxTokens, temperature = 0, timeoutMs }: ChatOptions): Promise<string | null> {
  try {
    const res = await fetch(`${LLM_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: false,
        ...(format ? { format } : {}),
        options: { temperature, num_predict: maxTokens },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn(`Ollama answered ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { message?: { content?: string } };
    return json.message?.content ?? null;
  } catch (err) {
    console.warn("Ollama unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Parses a JSON answer; null if it isn't valid JSON (e.g. cut off by the token cap). */
export function parseJsonAnswer(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
