import { FOODS, isFoodId } from "@/lib/nutrition/foods";
import { z } from "@/types/zod";
import { ollamaChat, parseJsonAnswer } from "../llm/ollama";

/*
 * Fallback for the quick bar: asks the local LLM to map text fragments the rule-based parser
 * couldn't match ("mantı", "a bowl of cacık") onto the food database. The model only picks ids
 * and gram estimates; nutrition always comes from our own data. Its answer is forced into a
 * JSON schema by Ollama and validated again here, so a confused model can't break anything.
 */

const TIMEOUT_MS = 20_000;

const matchSchema = z.object({
  fragment: z.string().max(120),
  foodId: z.string().max(40).nullable(),
  grams: z.number().positive().max(3000).nullable(),
});

/**
 * Exactly one entry per fragment: the length bound goes into the JSON schema Ollama enforces, so
 * a small model can't run on repeating entries until it hits the token limit.
 */
const answerSchemaFor = (count: number) => z.object({ matches: z.array(matchSchema).length(count) });

export interface AiMatch {
  fragment: string;
  foodId: string;
  grams: number | null;
}

const FOOD_LIST = FOODS.map((f) => `${f.id}: ${f.name} (tipik porsiyon ${f.portion} g)`).join("\n");

const SYSTEM = `You match Turkish food descriptions to the closest food in a fixed list.
For each fragment, pick the food id whose nutrition is most similar, even if it is not the same dish:
a rough match is much better than none. Use null only if the fragment is not food at all.
Estimate the grams eaten from the amount described (1 tabak ≈ 300 g, 1 kase ≈ 200 g, 1 porsiyon ≈ the typical portion);
use null if no amount is given. Return exactly one entry per fragment, in the same order. Answer with JSON only.

Examples: "ravioli" -> manti, "tzatziki" -> cacik, "türlü" -> stirFryVeg, "etli nohut" -> chickpeas,
"pilav üstü tavuk" -> chicken.

Foods (id: name):
${FOOD_LIST}`;

/** Matches for the fragments the model could place; [] if the LLM is unavailable or answers badly. */
export async function matchWithAi(fragments: string[]): Promise<AiMatch[]> {
  if (fragments.length === 0) return [];
  const aiAnswerSchema = answerSchemaFor(fragments.length);
  const answer = aiAnswerSchema.safeParse(
    parseJsonAnswer(
      await ollamaChat({
        system: SYSTEM,
        user: JSON.stringify({ fragments }),
        format: z.toJSONSchema(aiAnswerSchema),
        maxTokens: 80 * fragments.length + 40,
        timeoutMs: TIMEOUT_MS,
      }),
    ),
  );
  if (!answer.success) return [];
  // Small models don't always echo the fragment verbatim, so answers are matched by position
  // (one entry per fragment, same order); an exact text match wins when there is one.
  return fragments.flatMap((fragment, i) => {
    const m = answer.data.matches.find((x) => x.fragment === fragment) ?? answer.data.matches[i];
    return m?.foodId && isFoodId(m.foodId) ? [{ fragment, foodId: m.foodId, grams: m.grams }] : [];
  });
}
