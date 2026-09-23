import { createHash } from "node:crypto";
import { extractFeatures } from "./food/imageFeatures";
import { composePlate, detectNoFood } from "./food/recognize";

/** Structured nutrition data extracted from a food photo. */
export interface NutritionData {
  name: string;
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  /** Estimated portion size in grams, if known — informational; not persisted to the DB. */
  grams?: number;
}

export interface VisionInput {
  data: Buffer;
  mimeType: string;
}

export const NO_FOOD_MESSAGE = "Görselde besin tespit edilemedi. Lütfen tabağınızı net bir şekilde gösterin.";

/** The photo doesn't show a meal (a person, a blank wall, a screenshot…), so nothing should be logged. */
export class NoFoodError extends Error {
  constructor(
    /** Which check rejected the image — for logs, not for users. */
    readonly reason: string,
  ) {
    super(NO_FOOD_MESSAGE);
    this.name = "NoFoodError";
  }
}

/**
 * Vision AI handler. Swap the body of `analyzeFoodImage` for a real provider
 * (e.g. a multimodal LLM returning JSON) — callers only depend on this
 * signature, and `normalize` guards whatever the provider returns.
 *
 * Throws `NoFoodError` when the photo doesn't show food; the caller must not log a meal then.
 */
export async function analyzeFoodImage(input: VisionInput): Promise<NutritionData> {
  return mockAnalyze(input);
}

/**
 * Stand-in for a vision model, driven by image statistics: it rejects photos that
 * don't look like food, otherwise matches the photo's colours to a dish and works out
 * portion weight and macros from that. Deterministic: the same image always yields the same result.
 */
async function mockAnalyze({ data }: VisionInput): Promise<NutritionData> {
  await new Promise((resolve) => setTimeout(resolve, 800)); // simulate model latency

  const features = await extractFeatures(data);
  const rejection = detectNoFood(features);
  if (rejection) throw new NoFoodError(rejection);

  return normalize(composePlate(features, createHash("sha256").update(data).digest()));
}

/** Validate and round provider output; throws if it isn't usable. */
export function normalize(raw: NutritionData): NutritionData {
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 120) : "";
  const numbers = [raw.calories, raw.protein, raw.carbs, raw.fat];
  if (!name || numbers.some((n) => typeof n !== "number" || !Number.isFinite(n) || n < 0)) {
    throw new Error("Vision provider returned invalid nutrition data");
  }
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const grams =
    typeof raw.grams === "number" && Number.isFinite(raw.grams) && raw.grams > 0 ? Math.round(raw.grams) : undefined;
  return {
    name,
    calories: Math.round(raw.calories),
    protein: round1(raw.protein),
    carbs: round1(raw.carbs),
    fat: round1(raw.fat),
    ...(grams !== undefined ? { grams } : {}),
  };
}
