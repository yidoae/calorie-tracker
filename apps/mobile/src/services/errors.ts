import { describeError, MESSAGES, type MessageCode } from "./errorMessages";
import { supabaseConfigured } from "./supabase";

/*
 * Every failure the UI shows is an AppError with a Turkish message that says what to do next
 * (FR-022). The messages and the mapping from Supabase's errors live in errorMessages.ts.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: MessageCode,
  ) {
    super(message);
  }
}

/** An AppError for a failure the app detects itself. */
export function appError(code: MessageCode): AppError {
  return new AppError(MESSAGES[code], code);
}

/** Turns anything thrown by Supabase, fetch or a schema into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (!supabaseConfigured) return appError("not_configured");
  const { code, message } = describeError(err);
  return new AppError(message, code);
}
