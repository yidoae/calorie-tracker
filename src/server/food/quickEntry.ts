import { foodItem, getFood } from "@/lib/nutrition/foods";
import { mealName, parseMealText } from "@/lib/nutrition/quickParse";
import type { QuickParseResult } from "@/types/meal";
import { matchWithAi } from "./aiMatch";

/**
 * Quick-bar parsing on the server: the same rule-based parser the browser runs, plus the local
 * LLM for whatever it couldn't match.
 */
export async function parseQuickEntry(text: string): Promise<QuickParseResult> {
  const { foods, unmatched, slot } = parseMealText(text);
  const aiMatches = await matchWithAi(unmatched);

  const items = foods.flatMap(({ foodId, grams }) => {
    const food = getFood(foodId);
    return food ? [foodItem(food, grams)] : [];
  });
  for (const match of aiMatches) {
    const food = getFood(match.foodId);
    if (food) items.push(foodItem(food, match.grams ?? food.portion));
  }

  const aiMatched = aiMatches.map((m) => m.fragment);
  return {
    name: mealName(slot, items),
    items,
    unmatched: unmatched.filter((f) => !aiMatched.includes(f)),
    aiMatched,
  };
}
