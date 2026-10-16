import { systemInstruction } from "./prompt.ts";
import { responseSchema } from "./schema.ts";
import { AiUnavailable, type AiKind, type FoodRef, type ModelAnswer } from "./types.ts";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiCall {
  apiKey: string;
  model: string;
  kind: AiKind;
  foods: FoodRef[];
  /** Base64 JPEG for a photo, the user's text for a text analysis. */
  input: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/**
 * One `generateContent` call with JSON output constrained to our schema (research.md §1). Retries
 * once on 429/5xx; any other failure, a timeout or an empty answer throws AiUnavailable.
 */
export async function callGemini(call: GeminiCall): Promise<ModelAnswer> {
  const doFetch = call.fetch ?? fetch;
  const userPart = call.kind === "photo" ? { inline_data: { mime_type: "image/jpeg", data: call.input } } : { text: call.input };
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction(call.kind, call.foods) }] },
    contents: [{ role: "user", parts: [userPart] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: responseSchema(call.foods) },
  });
  const deadline = Date.now() + (call.timeoutMs ?? 20_000);

  for (let attempt = 0; attempt < 2; attempt++) {
    const left = deadline - Date.now();
    if (left <= 0) break;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), left);
    let res: Response;
    try {
      res = await doFetch(`${ENDPOINT}/${encodeURIComponent(call.model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": call.apiKey },
        body,
        signal: abort.signal,
      });
    } catch {
      throw new AiUnavailable("model request failed or timed out");
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429 || res.status >= 500) continue;
    if (!res.ok) throw new AiUnavailable(`model answered ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) throw new AiUnavailable("model answer is empty");
    return { text, inputTokens: data.usageMetadata?.promptTokenCount ?? 0, outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0 };
  }
  throw new AiUnavailable("model unavailable");
}
