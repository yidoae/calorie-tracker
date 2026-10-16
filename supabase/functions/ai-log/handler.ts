import { callGemini } from "../_shared/ai/gemini.ts";
import { AiUnavailable, type AiKind, type AiResult, type FoodRef, type ModelAnswer } from "../_shared/ai/types.ts";
import { validateAnswer } from "../_shared/ai/validate.ts";

/*
 * POST /functions/v1/ai-log (specs/003-ai-logging/contracts/ai-log.md). Order: size → user →
 * body → image → claim (allowance, retries) → model → checks → finish. Everything that touches
 * the database or the model comes in through `Deps`, so index.test.ts runs it with fakes.
 */

export const MAX_BODY_BYTES = 1_500_000;
export const MAX_IMAGE_SIDE = 1600;
const MAX_TEXT = 300;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Allowance {
  used: number;
  limit: number;
  resets_at: string;
}

export type Claim =
  | { status: "claimed"; id: string }
  | { status: "limit_reached"; resets_at: string }
  | { status: "existing"; id: string; row_status: "pending" | "counted" | "released"; result: AiResult | null; error: string | null };

export interface Finish {
  status: "counted" | "released";
  model: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  result: AiResult | null;
  error: string | null;
}

export interface Deps {
  /** The signed-in user's id for the bearer token, or null. */
  userId(token: string): Promise<string | null>;
  claim(userId: string, requestKey: string, kind: AiKind): Promise<Claim>;
  finish(id: string, finish: Finish): Promise<void>;
  /** The caller's allowance, read with their own token. */
  allowance(token: string): Promise<Allowance>;
  foods(): Promise<FoodRef[]>;
  model(kind: AiKind, foods: FoodRef[], input: string): Promise<ModelAnswer>;
  modelName: string;
  now(): number;
}

type ErrorCode = "invalid_request" | "not_authenticated" | "too_large" | "bad_image" | "no_food" | "limit_reached" | "ai_unavailable";
const STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  not_authenticated: 401,
  too_large: 413,
  bad_image: 422,
  no_food: 422,
  limit_reached: 429,
  ai_unavailable: 503,
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const fail = (code: ErrorCode, extra: Record<string, string> = {}) => json(STATUS[code], { error: code, ...extra });

/** Width and height from a JPEG's SOF marker, or null when the bytes are not a JPEG. */
export function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    // SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC) carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + length;
  }
  return null;
}

function decodeBase64(text: string): Uint8Array | null {
  try {
    const bin = atob(text);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** A stored attempt answered again: the same body or the same error, never a new count. */
async function replay(claim: Extract<Claim, { status: "existing" }>, deps: Deps, token: string): Promise<Response> {
  if (claim.row_status === "counted" && claim.result) return json(200, { ...claim.result, allowance: await deps.allowance(token) });
  if (claim.row_status === "released" && claim.error && claim.error in STATUS) return fail(claim.error as ErrorCode);
  return fail("ai_unavailable");
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return fail("invalid_request");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("too_large");

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = token ? await deps.userId(token) : null;
  if (!userId) return fail("not_authenticated");

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return fail("too_large");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("invalid_request");
  }
  const key = body?.request_key;
  const kind = body?.kind;
  if (typeof key !== "string" || !UUID.test(key) || (kind !== "photo" && kind !== "text")) return fail("invalid_request");

  let input: string;
  if (kind === "text") {
    if (typeof body.text !== "string") return fail("invalid_request");
    input = body.text.trim();
    if (input.length < 1 || input.length > MAX_TEXT) return fail("invalid_request");
  } else {
    if (typeof body.image !== "string" || !body.image) return fail("invalid_request");
    const bytes = decodeBase64(body.image);
    const size = bytes && jpegSize(bytes);
    if (!size) return fail("bad_image");
    if (size.width > MAX_IMAGE_SIDE || size.height > MAX_IMAGE_SIDE) return fail("too_large");
    input = body.image;
  }

  const claim = await deps.claim(userId, key, kind);
  if (claim.status === "limit_reached") return fail("limit_reached", { resets_at: claim.resets_at });
  if (claim.status === "existing") return replay(claim, deps, token);

  const started = deps.now();
  const settle = (f: Omit<Finish, "model" | "latencyMs">) => deps.finish(claim.id, { ...f, model: deps.modelName, latencyMs: Math.round(deps.now() - started) });
  try {
    const foods = await deps.foods();
    const answer = await deps.model(kind, foods, input);
    const result = validateAnswer(answer.text, new Map(foods.map((f) => [f.id, f])));
    const tokens = { inputTokens: answer.inputTokens, outputTokens: answer.outputTokens };
    if (result.items.length === 0) {
      await settle({ status: "released", ...tokens, result: null, error: "no_food" });
      return fail("no_food");
    }
    await settle({ status: "counted", ...tokens, result, error: null });
    return json(200, { ...result, allowance: await deps.allowance(token) });
  } catch (e) {
    if (!(e instanceof AiUnavailable)) console.error("ai-log", e);
    await settle({ status: "released", inputTokens: null, outputTokens: null, result: null, error: "ai_unavailable" });
    return fail("ai_unavailable");
  }
}

/** The real model behind `Deps.model`. */
export const geminiModel = (apiKey: string, model: string) => (kind: AiKind, foods: FoodRef[], input: string) =>
  callGemini({ apiKey, model, kind, foods, input });
