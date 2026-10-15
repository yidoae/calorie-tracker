/*
 * Values of a recipe dish (research.md §2): the pot's nutrients are the sum of its raw ingredients;
 * water adds weight only; the cooked weight comes from the owner's weighing, an FNDDS moisture change
 * or a USDA meat cooking yield.
 */
export interface Per100 {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  alcohol: number;
}

/** A recipe's yield with the FNDDS moisture change already looked up in the extract. */
export type ResolvedYield =
  | { kind: "weighed"; grams: number; date: string }
  | { kind: "fndds"; foodCode: number; moisturePct: number }
  | { kind: "usda_meat_yield"; table: string; yieldPct: number };

type YieldInput = { yield: ResolvedYield; ingredients: { grams: number }[]; waterG: number };

/** Weight of the whole cooked pot in grams. */
export function cookedWeight(r: YieldInput): number {
  if (r.yield.kind === "weighed") return r.yield.grams;
  const pot = r.ingredients.reduce((sum, i) => sum + i.grams, 0) + r.waterG;
  const factor = r.yield.kind === "fndds" ? 1 + r.yield.moisturePct / 100 : r.yield.yieldPct / 100;
  return round(pot * factor, 1);
}

/** Half-up rounding that is exact on decimal ties (1.005 → 1.01), unlike Math.round(x * 100) / 100. */
export function round(x: number, decimals: number): number {
  return Number(`${Math.round(Number(`${x}e${decimals}`))}e-${decimals}`);
}

/** The dish's values per 100 g, at full precision until the final two-decimal rounding. */
export function recipePer100(ingredients: { grams: number; per100: Per100 }[], cookedG: number): Per100 {
  const total = (key: keyof Per100) => ingredients.reduce((sum, i) => sum + (i.grams * i.per100[key]) / 100, 0);
  const per100 = (key: keyof Per100) => round((total(key) / cookedG) * 100, 2);
  return { kcal: per100("kcal"), protein: per100("protein"), carbs: per100("carbs"), fat: per100("fat"), alcohol: per100("alcohol") };
}
