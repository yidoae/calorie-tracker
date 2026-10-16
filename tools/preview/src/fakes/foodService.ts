// Preview stand-in for apps/mobile/src/services/foodService.ts: a few curated foods whose aliases
// start with a word of the query the app sends (typed words plus their stems), no network.
import type { FoodHit } from "@/services/foodService";

const food = (foodId: string, name: string, aliases: string[], portion: number, calories: number, protein: number, carbs: number, fat: number, portions: FoodHit["portions"] = []) => ({
  aliases,
  hit: { foodId, name, matchedAlias: aliases[0], typicalPortionG: portion, per100g: { calories, protein, carbs, fat }, portions } satisfies FoodHit,
});

const FOODS = [
  food("chicken_breast_grilled", "Izgara tavuk göğsü", ["tavuk", "tavuk göğsü", "ızgara tavuk"], 150, 165, 31, 0, 3.6),
  food("chicken_thigh", "Tavuk but (derisiz, ızgara)", ["tavuk but", "baget"], 150, 179, 25, 0, 8.2),
  food("chicken_saute", "Tavuk sote", ["tavuk sote", "sebzeli tavuk"], 250, 140, 18, 5, 5.5),
  food("white_rice", "Pirinç pilavı", ["pilav", "pirinç pilavı", "pirinç"], 150, 130, 2.7, 28, 0.3),
  food("bulgur", "Bulgur pilavı", ["bulgur", "bulgur pilavı"], 150, 120, 3.1, 21, 2.8),
  food("yogurt", "Yoğurt", ["yoğurt"], 150, 61, 3.5, 4.7, 3.3, [{ unit: "su bardağı", grams: 200 }, { unit: "yemek kaşığı", grams: 20 }]),
  food("lentil_soup", "Mercimek çorbası", ["mercimek çorbası", "çorba"], 250, 56, 3.6, 9, 1),
  food("egg", "Yumurta", ["yumurta", "haşlanmış yumurta"], 100, 155, 13, 1.1, 11, [{ unit: "adet", grams: 50 }]),
  food("simit", "Simit", ["simit"], 120, 330, 10, 58, 6.5, [{ unit: "adet", grams: 120 }]),
];

export const SAMPLE_HITS: FoodHit[] = FOODS.map((f) => f.hit);

export async function search(q: string): Promise<FoodHit[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const words = q.toLocaleLowerCase("tr-TR").split(" ");
  return FOODS.flatMap(({ aliases, hit }) => {
    const alias = aliases.find((a) => words.some((w) => a.startsWith(w)));
    return alias ? [{ ...hit, matchedAlias: alias }] : [];
  });
}

export async function byIds(ids: readonly string[]): Promise<FoodHit[]> {
  return ids.flatMap((id) => SAMPLE_HITS.find((h) => h.foodId === id) ?? []);
}
