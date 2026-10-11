// Preview stand-in for apps/mobile/src/services/errors.ts: the same AppError and Turkish messages,
// without the Supabase client (the real module imports it to detect a missing .env).
import { describeError, MESSAGES, type MessageCode } from "../../../../apps/mobile/src/services/errorMessages";

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: MessageCode,
  ) {
    super(message);
  }
}

export function appError(code: MessageCode): AppError {
  return new AppError(MESSAGES[code], code);
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const { code, message } = describeError(err);
  return new AppError(message, code);
}
