// Preview stand-in for apps/mobile/src/services/aiService.ts: a fixed analysis (two foods and one
// thing the "model" could not map) and an allowance with 3 of 5 left, no network.
import type { AiLogResult, Allowance } from "@calorie/core/schemas/ai";
import type { MessageCode } from "../../../../apps/mobile/src/services/errorMessages";
import { AppError, appError } from "./errors";

export class AiError extends AppError {
  constructor(
    code: MessageCode,
    readonly resetsAt: string | null = null,
  ) {
    super(appError(code).message, code);
  }
}

export type AiInput = { kind: "photo"; image: string } | { kind: "text"; text: string };

export const newRequestKey = (): string => "00000000-0000-4000-8000-0000000000ff";

const tomorrow = () => new Date(new Date().setHours(24, 0, 0, 0)).toISOString();

export async function analyse(_input: AiInput, _requestKey: string): Promise<AiLogResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    items: [
      { foodId: "lentil_soup", grams: 250, estimated: true },
      { foodId: "simit", grams: 60, estimated: false },
    ],
    unmatched: [{ description: "turşu suyu", grams: 200 }],
    allowance: { used: 3, limit: 5, resetsAt: tomorrow() },
  };
}

export async function allowance(): Promise<Allowance> {
  return { used: 2, limit: 5, resetsAt: tomorrow() };
}
