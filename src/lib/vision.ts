import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { extractFeatures } from "./food/imageFeatures";
import { composePlate, detectNoFood } from "./food/recognize";

/** Structured nutrition data extracted from a food photo. */
export interface NutritionData {
  name: string;
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export interface VisionInput {
  data: Buffer;
  mimeType: string;
}

export const NO_FOOD_MESSAGE = "No food detected in image. Please show a valid meal.";

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
 * Vision AI handler. Sends the photo to a Claude vision model and returns its
 * estimate, validated by `normalize`. Without `ANTHROPIC_API_KEY` it falls back
 * to the offline heuristic mock so local dev works without a key.
 *
 * Throws `NoFoodError` when the photo doesn't show food; the caller must not log a meal then.
 */
export async function analyzeFoodImage(input: VisionInput): Promise<NutritionData> {
  if (!process.env.ANTHROPIC_API_KEY) {
    if (!warnedAboutMock) {
      console.warn("ANTHROPIC_API_KEY is not set — using the offline mock food recognizer");
      warnedAboutMock = true;
    }
    return mockAnalyze(input);
  }
  return claudeAnalyze(input);
}

let warnedAboutMock = false;

// ---------------------------------------------------------------------------
// Claude vision

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** Longest edge sent to the model; larger images are downscaled server-side anyway. */
const MAX_EDGE_PX = 1568;

const SYSTEM_PROMPT = `You estimate the nutrition of meals from photos for a calorie-tracking app.

Decide first whether the photo shows food or drink someone is about to eat. People, pets, empty plates, packaging with no visible food, menus, screenshots and scenery are not food; set is_food to false and give a short reason.

If it is food, estimate the whole portion visible in the photo (all items on the plate or in the frame), not a standard serving. Judge portion size from cues like plate, cutlery and hand size. Name the meal in a few plain words (e.g. "Chicken caesar salad"). Give calories in kcal and protein, carbs and fat in grams. Check that protein*4 + carbs*4 + fat*9 roughly matches the calories.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    is_food: { type: "boolean" },
    not_food_reason: { type: "string", description: "Empty when is_food is true" },
    name: { type: "string", description: "Short meal name; empty when is_food is false" },
    calories: { type: "number", description: "kcal for the visible portion" },
    protein: { type: "number", description: "grams" },
    carbs: { type: "number", description: "grams" },
    fat: { type: "number", description: "grams" },
  },
  required: ["is_food", "not_food_reason", "name", "calories", "protein", "carbs", "fat"],
  additionalProperties: false,
} as const;

interface ClaudeNutrition extends NutritionData {
  is_food: boolean;
  not_food_reason: string;
}

let client: Anthropic | undefined;

async function claudeAnalyze({ data }: VisionInput): Promise<NutritionData> {
  client ??= new Anthropic();

  // Re-encode as a bounded JPEG: keeps the request small, strips EXIF, flattens GIF/PNG alpha.
  const jpeg = await sharp(data)
    .rotate()
    .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85 })
    .toBuffer();

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Re-run on Anthropic's recommended fallback model if a safety classifier declines.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
          { type: "text", text: "Estimate the nutrition of this meal." },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Vision model declined the request (${response.stop_details?.category ?? "unknown"})`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Vision model ran out of tokens before answering");
  }

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Vision model returned no text");
  const result = JSON.parse(text) as ClaudeNutrition;

  if (!result.is_food) throw new NoFoodError(`model: ${result.not_food_reason || "not food"}`);
  return normalize(result);
}

// ---------------------------------------------------------------------------
// Offline mock

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
  return {
    name,
    calories: Math.round(raw.calories),
    protein: round1(raw.protein),
    carbs: round1(raw.carbs),
    fat: round1(raw.fat),
  };
}
