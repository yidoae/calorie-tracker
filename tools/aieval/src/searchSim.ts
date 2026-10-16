import type { FoodHit } from "@calorie/core/schemas/rows";
import { normalizeTr } from "@calorie/core/search/normalize";
import type { EvalFood } from "./cases.ts";

/*
 * public.search_foods (supabase/migrations/20261015000100_food_schema.sql) in TypeScript, so the
 * text preview can be scored offline in CI: an alias equal to a query word sequence first, then a
 * prefix match, then pg_trgm similarity ≥ 0.3; one row per food with its best alias. On food list 2
 * it ranks all 116 committed search cases as the database does.
 */

/** pg_trgm: trigrams of each word padded with two leading spaces and one trailing space. */
function trigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const word of text.split(/[^a-z0-9]+/).filter(Boolean)) {
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) out.add(padded.slice(i, i + 3));
  }
  return out;
}

function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  const union = A.size + B.size - shared;
  return union === 0 ? 0 : shared / union;
}

export function makeSearch(foods: EvalFood[]): (q: string, max?: number) => FoodHit[] {
  const aliases = foods.flatMap((f) => f.aliases.map((a) => ({ food: f, alias: a, normalized: normalizeTr(a) })));
  return (q, max = 20) => {
    const nq = normalizeTr(q);
    const terms = [...new Set(nq.split(" "))];
    const best = new Map<string, { food: EvalFood; alias: string; score: number }>();
    for (const { food, alias, normalized } of aliases) {
      let score: number;
      if ((" " + nq + " ").includes(" " + normalized + " ")) score = 3 + normalized.length / 100;
      else if (normalized.startsWith(nq) || terms.some((t) => normalized.startsWith(t))) score = 2 + similarity(normalized, nq);
      else score = Math.max(similarity(normalized, nq), ...terms.map((t) => similarity(normalized, t)));
      if (score < 0.3) continue;
      const cur = best.get(food.id);
      if (!cur || score > cur.score || (score === cur.score && (alias.length < cur.alias.length || (alias.length === cur.alias.length && alias < cur.alias)))) {
        best.set(food.id, { food, alias, score });
      }
    }
    return [...best.values()]
      .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "tr"))
      .slice(0, max)
      .map(({ food, alias }) => ({
        foodId: food.id,
        name: food.name,
        matchedAlias: alias,
        typicalPortionG: food.typicalPortionG,
        per100g: { calories: food.per100.kcal, protein: food.per100.protein, carbs: food.per100.carbs, fat: food.per100.fat },
        portions: food.portions,
      }));
  };
}
