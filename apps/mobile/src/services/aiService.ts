import { aiErrorSchema, aiLogResponseSchema, allowanceRowSchema, type AiErrorCode, type AiLogResult, type Allowance } from "@calorie/core/schemas/ai";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import type { MessageCode } from "./errorMessages";
import { AppError, appError, toAppError } from "./errors";
import { supabase } from "./supabase";

/*
 * The only caller of the ai-log Edge Function and of ai_allowance() (003, contracts/ai-log.md).
 * Every answer is parsed with the core schemas; the function's error codes become AppErrors with
 * Turkish text. A new request key per attempt; the caller passes the same key to retry it, so a
 * retry is counted once.
 */

const TIMEOUT_MS = 25_000;

const CODES: Record<AiErrorCode, MessageCode> = {
  invalid_request: "ai_invalid_request",
  not_authenticated: "session_expired",
  too_large: "ai_too_large",
  bad_image: "ai_bad_image",
  no_food: "ai_no_food",
  limit_reached: "ai_limit_reached",
  ai_unavailable: "ai_unavailable",
};

/** An AI failure; `resetsAt` is set when the daily allowance is used up. */
export class AiError extends AppError {
  constructor(
    code: MessageCode,
    readonly resetsAt: string | null = null,
  ) {
    super(appError(code).message, code);
  }
}

export const newRequestKey = (): string => Crypto.randomUUID();

export type AiInput = { kind: "photo"; image: string } | { kind: "text"; text: string };

export async function analyse(input: AiInput, requestKey: string): Promise<AiLogResult> {
  const { data, error } = await supabase.functions.invoke("ai-log", { body: { request_key: requestKey, ...input }, timeout: TIMEOUT_MS });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = aiErrorSchema.safeParse(await (error.context as Response).json().catch(() => null));
      if (body.success) throw new AiError(CODES[body.data.error], body.data.resets_at ?? null);
      throw new AiError("ai_unavailable");
    }
    const appErr = toAppError(error);
    throw appErr.code === "network" ? appErr : new AiError("ai_unavailable");
  }
  return aiLogResponseSchema.parse(data);
}

export async function allowance(): Promise<Allowance> {
  const { data, error } = await supabase.rpc("ai_allowance").single();
  if (error) throw toAppError(error);
  return allowanceRowSchema.parse(data);
}
