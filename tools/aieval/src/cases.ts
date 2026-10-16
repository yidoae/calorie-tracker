import { readFileSync } from "node:fs";
import { z } from "@calorie/core/schemas/zod";

/*
 * The evaluation inputs (specs/003-ai-logging/data-model.md "Evaluation set"): the food list as
 * tools/fooddata built it, the phrase cases and the owner's weighed photos. Every case names foods
 * by id; an unknown id fails the load.
 */

const foodSchema = z.object({
  id: z.string(),
  name: z.string(),
  typicalPortionG: z.number().positive(),
  per100: z.object({ kcal: z.number(), protein: z.number(), carbs: z.number(), fat: z.number(), alcohol: z.number() }),
  portions: z.array(z.object({ unit: z.string(), grams: z.number().positive() })),
  aliases: z.array(z.string()),
});
export type EvalFood = z.infer<typeof foodSchema>;

const itemSchema = z.object({ food_id: z.string(), grams: z.number().positive().max(5000) });
export type ExpectedItem = z.infer<typeof itemSchema>;

const phraseSchema = z.object({ text: z.string().min(1).max(300), items: z.array(itemSchema).min(1) });
export type PhraseCase = z.infer<typeof phraseSchema>;

const photoSchema = z.object({ id: z.string(), file: z.string(), taken: z.string(), items: z.array(itemSchema).min(1) });
export type PhotoCase = z.infer<typeof photoSchema>;

const json = (url: URL) => JSON.parse(readFileSync(url, "utf8")) as unknown;

export function loadFoods(): EvalFood[] {
  return z.array(foodSchema).parse(json(new URL("../../fooddata/out/foods.json", import.meta.url)));
}

function checkIds<T extends { items: ExpectedItem[] }>(cases: T[], foods: EvalFood[], label: (c: T) => string): T[] {
  const ids = new Set(foods.map((f) => f.id));
  const unknown = cases.flatMap((c) => c.items.filter((i) => !ids.has(i.food_id)).map((i) => `${label(c)}: unknown food ${i.food_id}`));
  if (unknown.length > 0) throw new Error(unknown.join("\n"));
  return cases;
}

export function loadPhrases(foods: EvalFood[]): PhraseCase[] {
  return checkIds(z.array(phraseSchema).parse(json(new URL("../cases/phrases.json", import.meta.url))), foods, (c) => c.text);
}

export function loadPhotos(foods: EvalFood[]): PhotoCase[] {
  return checkIds(z.array(photoSchema).parse(json(new URL("../cases/photos.json", import.meta.url))), foods, (c) => c.id);
}
