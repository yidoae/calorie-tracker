import { MAX_ITEM_GRAMS } from "@calorie/core/schemas/nutrition";
import type { FoodHit } from "@calorie/core/schemas/rows";
import { normalizeTr } from "@calorie/core/search/normalize";
import type { ParsedPhrase } from "@calorie/core/text/parseMeal";
import type { ProposedFood } from "./mealLogic";

/*
 * The on-device text preview (003 FR-007, FR-008): each parsed phrase with the food the search
 * found for it and grams from the stated amount and the food's portions. No React Native imports,
 * so tests/textPreviewLogic.test.ts runs this under node.
 */

export interface PreviewLine {
  phrase: string;
  /** null when the search found nothing for the phrase. */
  food: FoodHit | null;
  grams: number | null;
  /** The grams were not computed from a stated amount and a portion the food has. */
  estimated: boolean;
}

const round = (g: number) => Math.round(Math.min(g, MAX_ITEM_GRAMS) * 10) / 10;

/** The first hit, unless a negated word ("şekersiz") names a hit that carries it ("Çay (şekersiz)"). */
function chooseHit(parsed: ParsedPhrase, hits: readonly FoodHit[]): FoodHit | null {
  if (parsed.negated.length > 0) {
    const negated = parsed.negated.map(normalizeTr);
    const carrying = hits.find((h) => negated.some((n) => normalizeTr(h.name).includes(n)));
    if (carrying) return carrying;
  }
  // A stated unit picks a hit that has it as a portion or in its name: "1 dürüm döner" is the wrap.
  const { unit } = parsed;
  if (unit !== null && hits[0] && !hasUnit(hits[0], unit)) {
    const withUnit = hits.slice(0, 5).find((h) => hasUnit(h, unit));
    if (withUnit) return withUnit;
  }
  return hits[0] ?? null;
}

const hasPortion = (food: FoodHit, unit: string) => food.portions.some((p) => p.unit === unit);
const hasUnit = (food: FoodHit, unit: string) => hasPortion(food, unit) || normalizeTr(food.name).includes(normalizeTr(unit));

export function previewLine(parsed: ParsedPhrase, hits: readonly FoodHit[]): PreviewLine {
  const food = chooseHit(parsed, hits);
  if (!food) return { phrase: parsed.phrase, food: null, grams: null, estimated: true };
  const { amount, unitKind } = parsed;
  // A unit that names the food ("Dürüm döner") counts pieces of it.
  const unit = parsed.unit !== null && !hasPortion(food, parsed.unit) && hasUnit(food, parsed.unit) ? null : parsed.unit;
  if (amount === null) return { phrase: parsed.phrase, food, grams: round(food.typicalPortionG), estimated: true };
  if (unitKind === "gram") return { phrase: parsed.phrase, food, grams: round(amount), estimated: false };
  // A bare count means pieces: "10 kiraz" is ten cherries, not ten bowls.
  const portion = unit === null ? (food.portions.find((p) => p.unit === "adet") ?? food.portions[0]) : food.portions.find((p) => p.unit === unit);
  if (portion) return { phrase: parsed.phrase, food, grams: round(amount * portion.grams), estimated: false };
  return { phrase: parsed.phrase, food, grams: round(amount * food.typicalPortionG), estimated: true };
}

/** The matched lines as foods for the meal draft. */
export function proposedFoods(lines: readonly PreviewLine[]): ProposedFood[] {
  return lines.flatMap((l) => (l.food && l.grams !== null && l.grams > 0 ? [{ food: l.food, grams: l.grams, estimated: l.estimated }] : []));
}
