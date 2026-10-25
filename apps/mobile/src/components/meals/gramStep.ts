import { parseGrams } from "@calorie/core/nutrition/macros";
import { MAX_ITEM_GRAMS } from "@calorie/core/schemas/nutrition";

const STEP = 10;

/** The gram field's −/+ (design proposal K7): snaps to the next ten, from 10 to the 5.000 g cap; an empty or invalid field steps from 0. */
export function stepGrams(text: string, delta: 1 | -1): string {
  const grams = parseGrams(text) ?? 0;
  const next = delta > 0 ? Math.floor(grams / STEP) * STEP + STEP : Math.ceil(grams / STEP) * STEP - STEP;
  return String(Math.min(MAX_ITEM_GRAMS, Math.max(STEP, next)));
}

/** Spoken labels of the gram field's −/+ buttons. */
export const GRAM_STEP = { less: "10 gram azalt", more: "10 gram artır" } as const;
