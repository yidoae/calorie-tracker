import { AiUnavailable, type AiResult, type FoodRef, type ProposedItem, type Unmatched } from "./types.ts";

/** Same bounds as the meal: grams per item and items per meal (core MAX_ITEM_GRAMS, MAX_AI_ITEMS). */
const MAX_GRAMS = 5000;
const MAX_ITEMS = 30;
const MAX_DESCRIPTION = 120;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const round1 = (g: number) => Math.round(g * 10) / 10;

/**
 * Checks the model's JSON against our list again (constitution V; the API may ignore parts of the
 * schema): unknown ids become unmatched, grams must be positive, are capped at 5000 g (and then
 * marked estimated), the same food is summed into one item, at most 30 items. Throws AiUnavailable
 * when the body is not the agreed shape. An empty `items` means no food was found.
 */
export function validateAnswer(text: string, foods: ReadonlyMap<string, FoodRef>): AiResult {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AiUnavailable("model answer is not JSON");
  }
  if (!isObject(body) || !Array.isArray(body.items) || (body.unmatched !== undefined && !Array.isArray(body.unmatched))) {
    throw new AiUnavailable("model answer has the wrong shape");
  }

  const items = new Map<string, ProposedItem>();
  const unmatched: Unmatched[] = [];
  for (const raw of body.items) {
    if (!isObject(raw) || typeof raw.food_id !== "string" || typeof raw.grams !== "number" || !Number.isFinite(raw.grams)) continue;
    if (raw.grams <= 0) continue;
    if (!foods.has(raw.food_id)) {
      unmatched.push({ description: raw.food_id.slice(0, MAX_DESCRIPTION), grams: round1(Math.min(raw.grams, MAX_GRAMS)) });
      continue;
    }
    const prev = items.get(raw.food_id);
    const grams = (prev?.grams ?? 0) + raw.grams;
    const estimated = raw.estimated !== false || prev?.estimated === true || grams > MAX_GRAMS;
    items.set(raw.food_id, { food_id: raw.food_id, grams: Math.min(grams, MAX_GRAMS), estimated });
  }
  for (const raw of (body.unmatched ?? []) as unknown[]) {
    if (!isObject(raw) || typeof raw.description !== "string" || !raw.description.trim()) continue;
    const grams = typeof raw.grams === "number" && raw.grams > 0 ? round1(Math.min(raw.grams, MAX_GRAMS)) : undefined;
    unmatched.push(grams === undefined ? { description: raw.description.trim().slice(0, MAX_DESCRIPTION) } : { description: raw.description.trim().slice(0, MAX_DESCRIPTION), grams });
  }

  return {
    items: [...items.values()].slice(0, MAX_ITEMS).map((i) => ({ ...i, grams: round1(i.grams) })),
    unmatched,
  };
}
