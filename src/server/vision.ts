import { createHash } from "node:crypto";
import { mealDraftSchema, type MealDraft } from "@/types/meal";
import { extractFeatures } from "./food/imageFeatures";
import { composePlate, detectNoFood } from "./food/recognize";

export interface VisionInput {
  data: Buffer;
  mimeType: string;
}

export const NO_FOOD_MESSAGE = "Görselde yemek algılanamadı. Lütfen geçerli bir öğün gösterin.";

/** The photo doesn't show a meal (a person, a blank wall, a screenshot…), so nothing should be logged. */
export class NoFoodError extends Error {
  constructor(
    /** Which check rejected the image, for logs, not for users. */
    readonly reason: string,
  ) {
    super(NO_FOOD_MESSAGE);
    this.name = "NoFoodError";
  }
}

/** The provider answered, but not with usable data. */
export class VisionOutputError extends Error {
  constructor(readonly issues: string) {
    super("Görüntü analizi geçersiz veri döndürdü");
    this.name = "VisionOutputError";
  }
}

/**
 * Vision AI handler: photo in, plate breakdown out (dish name + components with grams and
 * nutrition per 100 g). Swap the body of `analyzeFoodImage` for a real provider (e.g. a
 * multimodal LLM returning JSON): callers only depend on this signature, and the provider's
 * output always passes through `mealDraftSchema` before anyone uses it.
 *
 * Throws `NoFoodError` when the photo doesn't show food; the caller must not log a meal then.
 */
export async function analyzeFoodImage(input: VisionInput): Promise<MealDraft> {
  const raw: unknown = await mockAnalyze(input);
  const parsed = mealDraftSchema.safeParse(raw);
  if (!parsed.success) throw new VisionOutputError(parsed.error.message);
  return parsed.data;
}

/**
 * Stand-in for a vision model, driven by image statistics: it rejects photos that don't look like
 * food, otherwise matches the photo's colours to a dish and estimates each component's weight.
 * Deterministic: the same image always yields the same result.
 */
async function mockAnalyze({ data }: VisionInput): Promise<MealDraft> {
  await new Promise((resolve) => setTimeout(resolve, 800)); // simulate model latency

  const features = await extractFeatures(data);
  const rejection = detectNoFood(features);
  if (rejection) throw new NoFoodError(rejection);

  return composePlate(features, createHash("sha256").update(data).digest());
}
