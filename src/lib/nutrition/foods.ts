import type { FoodCategory, Macros, MealItem } from "@/types/nutrition";

/*
 * The app's single food database: Turkish names, category, nutrition per 100 g (approximate,
 * as eaten) and typical portion/unit weights. Used by the photo analyser (server/food), the
 * quick-entry parser (lib/nutrition/quickParse.ts) and the daily suggestions (insights.ts).
 */

/** Household units the quick bar understands. */
export type FoodUnit = "adet" | "dilim" | "kase" | "bardak" | "yemekKasigi" | "cayKasigi" | "avuc" | "kutu" | "olcek";

export interface Food {
  id: string;
  /** Display name (Turkish). */
  name: string;
  category: FoodCategory;
  per100g: Macros;
  /** Lower-case Turkish phrases that refer to this food; the longest match wins. */
  aliases: string[];
  /** Grams in one typical serving, used when no quantity is given. */
  portion: number;
  /** Grams per household unit, where it differs from the generic defaults. */
  units?: Partial<Record<FoodUnit, number>>;
}

const m = (calories: number, protein: number, carbs: number, fat: number): Macros => ({ calories, protein, carbs, fat });

export const FOODS = [
  // Protein sources
  { id: "chicken", name: "Izgara tavuk", category: "protein", per100g: m(165, 31, 0, 3.6), aliases: ["ızgara tavuk", "tavuk göğsü", "tavuk", "piliç", "grilled chicken", "chicken"], portion: 150 },
  { id: "friedChicken", name: "Kızarmış tavuk", category: "protein", per100g: m(246, 19, 10, 14), aliases: ["kızarmış tavuk", "tavuk kızartma", "nugget"], portion: 150 },
  { id: "doner", name: "Döner", category: "protein", per100g: m(215, 18, 4, 14), aliases: ["döner", "tavuk döner", "et döner"], portion: 150 },
  { id: "salmon", name: "Somon", category: "protein", per100g: m(206, 22, 0, 12), aliases: ["somon", "salmon"], portion: 150 },
  { id: "tuna", name: "Ton balığı", category: "protein", per100g: m(116, 26, 0, 0.8), aliases: ["ton balığı", "ton"], portion: 100, units: { kutu: 120 } },
  { id: "shrimp", name: "Karides", category: "protein", per100g: m(99, 24, 0.2, 0.3), aliases: ["karides", "shrimp"], portion: 120 },
  { id: "steak", name: "Biftek", category: "protein", per100g: m(250, 26, 0, 15), aliases: ["biftek", "bonfile", "dana eti", "kırmızı et", "et", "steak"], portion: 150 },
  { id: "kofte", name: "Köfte", category: "protein", per100g: m(230, 16, 6, 16), aliases: ["ızgara köfte", "köfte"], portion: 150, units: { adet: 25 } },
  { id: "beefPatty", name: "Hamburger köftesi", category: "protein", per100g: m(254, 17, 0, 20), aliases: ["hamburger köftesi", "burger köftesi"], portion: 110, units: { adet: 110 } },
  { id: "bolognese", name: "Kıymalı sos", category: "protein", per100g: m(120, 8, 7, 7), aliases: ["kıymalı sos", "bolonez sos", "kıyma"], portion: 150 },
  { id: "egg", name: "Yumurta", category: "protein", per100g: m(155, 13, 1.1, 11), aliases: ["haşlanmış yumurta", "yumurta", "egg"], portion: 100, units: { adet: 50 } },
  { id: "eggFried", name: "Omlet / sahanda yumurta", category: "protein", per100g: m(196, 14, 0.8, 15), aliases: ["sahanda yumurta", "omlet", "yağda yumurta"], portion: 120, units: { adet: 60 } },
  { id: "menemen", name: "Menemen", category: "protein", per100g: m(100, 6, 4, 7), aliases: ["menemen"], portion: 250 },
  { id: "turkey", name: "Hindi füme", category: "protein", per100g: m(104, 17, 4, 2), aliases: ["hindi füme", "hindi"], portion: 45, units: { dilim: 15 } },
  { id: "sucuk", name: "Sucuk", category: "protein", per100g: m(452, 24, 2, 39), aliases: ["sucuk"], portion: 40, units: { dilim: 10 } },
  { id: "lentils", name: "Mercimek", category: "protein", per100g: m(116, 9, 20, 0.4), aliases: ["yeşil mercimek", "mercimek", "lentils"], portion: 150 },
  { id: "chickpeas", name: "Nohut", category: "protein", per100g: m(164, 8.9, 27, 2.6), aliases: ["nohut"], portion: 150 },
  { id: "proteinPowder", name: "Protein tozu", category: "protein", per100g: m(380, 78, 8, 5), aliases: ["protein tozu", "whey", "protein shake"], portion: 30, units: { olcek: 30 } },
  // Carbohydrate sources
  { id: "whiteRice", name: "Pirinç pilavı", category: "carb", per100g: m(130, 2.7, 28, 0.3), aliases: ["pirinç pilavı", "beyaz pirinç", "pirinç", "pilav", "white rice", "rice"], portion: 150, units: { kase: 150, yemekKasigi: 15 } },
  { id: "bulgur", name: "Bulgur pilavı", category: "carb", per100g: m(120, 3.1, 21, 2.8), aliases: ["bulgur pilavı", "bulgur"], portion: 150, units: { kase: 150, yemekKasigi: 15 } },
  { id: "brownRice", name: "Esmer pirinç", category: "carb", per100g: m(123, 2.7, 26, 1), aliases: ["esmer pirinç", "brown rice"], portion: 150, units: { kase: 150 } },
  { id: "spaghetti", name: "Makarna", category: "carb", per100g: m(158, 5.8, 31, 0.9), aliases: ["spagetti", "makarna", "spaghetti", "pasta"], portion: 200, units: { kase: 180 } },
  { id: "noodles", name: "Erişte", category: "carb", per100g: m(138, 4.5, 25, 2.1), aliases: ["erişte", "noodle"], portion: 200 },
  { id: "fries", name: "Patates kızartması", category: "carb", per100g: m(312, 3.4, 41, 15), aliases: ["patates kızartması", "kızartma patates", "cips patates", "fries"], portion: 120 },
  { id: "potato", name: "Patates", category: "carb", per100g: m(87, 1.9, 20, 0.1), aliases: ["haşlanmış patates", "patates püresi", "patates", "potato"], portion: 150, units: { adet: 170 } },
  { id: "sweetPotato", name: "Tatlı patates", category: "carb", per100g: m(90, 2, 21, 0.1), aliases: ["tatlı patates", "sweet potato"], portion: 150, units: { adet: 150 } },
  { id: "bread", name: "Beyaz ekmek", category: "carb", per100g: m(250, 12.5, 43, 3.5), aliases: ["beyaz ekmek", "tost ekmeği", "ekmek", "toast", "bread"], portion: 50, units: { dilim: 30 } },
  { id: "wholeWheatBread", name: "Tam buğday ekmeği", category: "carb", per100g: m(247, 13, 41, 3.4), aliases: ["tam buğday ekmeği", "tam buğdaylı ekmek", "kepekli ekmek", "çavdar ekmeği"], portion: 60, units: { dilim: 30 } },
  { id: "bun", name: "Hamburger ekmeği", category: "carb", per100g: m(270, 9, 49, 4), aliases: ["hamburger ekmeği", "sandviç ekmeği", "bun"], portion: 90, units: { adet: 90 } },
  { id: "simit", name: "Simit", category: "carb", per100g: m(290, 9, 55, 4), aliases: ["simit"], portion: 100, units: { adet: 100 } },
  { id: "lahmacun", name: "Lahmacun", category: "carb", per100g: m(215, 10, 30, 6), aliases: ["lahmacun"], portion: 170, units: { adet: 170 } },
  { id: "pizza", name: "Pizza", category: "carb", per100g: m(266, 11, 33, 10), aliases: ["pizza"], portion: 220, units: { dilim: 110 } },
  { id: "oats", name: "Yulaf lapası", category: "carb", per100g: m(71, 2.5, 12, 1.5), aliases: ["yulaf lapası", "oatmeal", "porridge"], portion: 240, units: { kase: 240 } },
  { id: "oatsDry", name: "Yulaf ezmesi", category: "carb", per100g: m(389, 17, 66, 7), aliases: ["yulaf ezmesi", "yulaf"], portion: 40, units: { yemekKasigi: 8, kase: 40 } },
  { id: "corn", name: "Mısır", category: "carb", per100g: m(96, 3.4, 21, 1.5), aliases: ["mısır", "corn"], portion: 80 },
  { id: "lentilSoup", name: "Mercimek çorbası", category: "carb", per100g: m(56, 3.6, 9, 1), aliases: ["mercimek çorbası", "çorba"], portion: 250, units: { kase: 250 } },
  { id: "honey", name: "Bal", category: "carb", per100g: m(304, 0.3, 82, 0), aliases: ["bal", "honey"], portion: 20, units: { yemekKasigi: 20, cayKasigi: 7 } },
  // Vegetables
  { id: "greens", name: "Yeşil salata", category: "vegetable", per100g: m(17, 1.5, 3, 0.2), aliases: ["yeşil salata", "çoban salata", "karışık yeşillik", "salata", "yeşillik", "marul", "roka", "salad"], portion: 100, units: { kase: 100 } },
  { id: "broccoli", name: "Brokoli", category: "vegetable", per100g: m(35, 2.4, 7.2, 0.4), aliases: ["brokoli", "broccoli"], portion: 100 },
  { id: "greenBeans", name: "Taze fasulye", category: "vegetable", per100g: m(31, 1.8, 7, 0.2), aliases: ["taze fasulye", "green beans"], portion: 150 },
  { id: "stirFryVeg", name: "Sebze sote", category: "vegetable", per100g: m(65, 2.5, 10, 2), aliases: ["sebze sote", "sote sebze", "sebze", "vegetables"], portion: 150 },
  { id: "tomato", name: "Domates", category: "vegetable", per100g: m(18, 0.9, 3.9, 0.2), aliases: ["domates", "tomato"], portion: 120, units: { adet: 120 } },
  { id: "cucumber", name: "Salatalık", category: "vegetable", per100g: m(15, 0.7, 3.6, 0.1), aliases: ["salatalık", "hıyar"], portion: 150, units: { adet: 150 } },
  { id: "redPepper", name: "Kırmızı biber", category: "vegetable", per100g: m(31, 1, 6, 0.3), aliases: ["kırmızı biber", "biber"], portion: 100, units: { adet: 120 } },
  { id: "carrot", name: "Havuç", category: "vegetable", per100g: m(41, 0.9, 10, 0.2), aliases: ["havuç", "carrot"], portion: 60, units: { adet: 60 } },
  // Fruit
  { id: "banana", name: "Muz", category: "fruit", per100g: m(89, 1.1, 23, 0.3), aliases: ["muz", "banana"], portion: 120, units: { adet: 120 } },
  { id: "apple", name: "Elma", category: "fruit", per100g: m(52, 0.3, 14, 0.2), aliases: ["elma", "apple"], portion: 180, units: { adet: 180 } },
  { id: "orange", name: "Portakal", category: "fruit", per100g: m(47, 0.9, 12, 0.1), aliases: ["portakal", "mandalina", "orange"], portion: 150, units: { adet: 150 } },
  { id: "berries", name: "Orman meyveleri", category: "fruit", per100g: m(57, 0.7, 14, 0.3), aliases: ["orman meyvesi", "orman meyveleri", "çilek", "yaban mersini", "berries"], portion: 100, units: { kase: 120 } },
  // Dairy
  { id: "yogurtGreek", name: "Süzme yoğurt", category: "dairy", per100g: m(97, 9, 3.9, 5), aliases: ["süzme yoğurt", "yunan yoğurdu", "greek yogurt"], portion: 150, units: { kase: 200, yemekKasigi: 20 } },
  { id: "yogurt", name: "Yoğurt", category: "dairy", per100g: m(61, 3.5, 4.7, 3.3), aliases: ["yoğurt", "yogurt"], portion: 150, units: { kase: 200, yemekKasigi: 20 } },
  { id: "ayran", name: "Ayran", category: "dairy", per100g: m(36, 1.7, 2.6, 2), aliases: ["ayran"], portion: 200, units: { bardak: 200 } },
  { id: "milk", name: "Süt", category: "dairy", per100g: m(61, 3.2, 4.8, 3.3), aliases: ["süt", "milk"], portion: 200, units: { bardak: 200 } },
  { id: "cheese", name: "Kaşar peyniri", category: "dairy", per100g: m(280, 22, 2.2, 22), aliases: ["kaşar peyniri", "kaşar", "cheddar", "cheese"], portion: 30, units: { dilim: 20 } },
  { id: "whiteCheese", name: "Beyaz peynir", category: "dairy", per100g: m(264, 14, 4, 21), aliases: ["beyaz peynir", "peynir", "feta"], portion: 30, units: { dilim: 30 } },
  // Turkish dishes (whole-dish averages, so one alias covers the plate)
  { id: "manti", name: "Mantı", category: "carb", per100g: m(190, 9, 25, 6), aliases: ["mantı"], portion: 250 },
  { id: "iskender", name: "İskender", category: "protein", per100g: m(180, 11, 12, 10), aliases: ["iskender", "iskender kebap"], portion: 350 },
  { id: "karniyarik", name: "Karnıyarık", category: "vegetable", per100g: m(110, 5, 7, 7), aliases: ["karnıyarık", "imam bayıldı", "musakka"], portion: 300 },
  { id: "kuruFasulye", name: "Kuru fasulye", category: "protein", per100g: m(125, 7, 15, 4), aliases: ["kuru fasulye", "barbunya"], portion: 250, units: { kase: 250 } },
  { id: "borek", name: "Börek", category: "carb", per100g: m(260, 10, 25, 13), aliases: ["su böreği", "börek", "gözleme"], portion: 150, units: { dilim: 100, adet: 150 } },
  { id: "pide", name: "Pide", category: "carb", per100g: m(260, 12, 33, 9), aliases: ["kaşarlı pide", "kıymalı pide", "pide"], portion: 250, units: { adet: 250, dilim: 60 } },
  { id: "tost", name: "Kaşarlı tost", category: "carb", per100g: m(290, 13, 30, 13), aliases: ["kaşarlı tost", "karışık tost", "tost"], portion: 150, units: { adet: 150 } },
  { id: "sutlac", name: "Sütlaç", category: "dairy", per100g: m(125, 3.5, 21, 3), aliases: ["sütlaç", "muhallebi", "puding"], portion: 200, units: { kase: 200 } },
  { id: "baklava", name: "Baklava", category: "fat", per100g: m(430, 7, 48, 24), aliases: ["baklava"], portion: 90, units: { dilim: 30, adet: 30 } },
  { id: "cacik", name: "Cacık", category: "dairy", per100g: m(45, 2.5, 3.5, 2.5), aliases: ["cacık", "haydari"], portion: 200, units: { kase: 200 } },
  // Fats, sauces and nuts
  { id: "oil", name: "Zeytinyağı", category: "fat", per100g: m(884, 0, 0, 100), aliases: ["zeytinyağı", "sıvı yağ", "yağ", "olive oil"], portion: 10, units: { yemekKasigi: 13, cayKasigi: 5 } },
  { id: "butter", name: "Tereyağı", category: "fat", per100g: m(717, 0.9, 0.1, 81), aliases: ["tereyağı", "butter"], portion: 10, units: { yemekKasigi: 14, cayKasigi: 5 } },
  { id: "avocado", name: "Avokado", category: "fat", per100g: m(160, 2, 8.5, 14.7), aliases: ["avokado", "avocado"], portion: 75, units: { adet: 150 } },
  { id: "olives", name: "Zeytin", category: "fat", per100g: m(115, 0.8, 6, 11), aliases: ["zeytin", "olives"], portion: 30, units: { adet: 4 } },
  { id: "walnuts", name: "Ceviz", category: "fat", per100g: m(654, 15, 14, 65), aliases: ["ceviz", "walnut"], portion: 30, units: { adet: 5, avuc: 30 } },
  { id: "almonds", name: "Badem", category: "fat", per100g: m(579, 21, 22, 50), aliases: ["badem", "almond"], portion: 30, units: { adet: 1.2, avuc: 30 } },
  { id: "hummus", name: "Humus", category: "fat", per100g: m(166, 7.9, 14, 9.6), aliases: ["humus", "hummus"], portion: 60, units: { yemekKasigi: 15 } },
] as const satisfies readonly Food[];

export type FoodId = (typeof FOODS)[number]["id"];

const BY_ID = new Map<string, Food>(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): Food | undefined {
  return BY_ID.get(id);
}

export function isFoodId(id: string): id is FoodId {
  return BY_ID.has(id);
}

/** A meal component for `grams` of a food. */
export function foodItem(food: Food, grams: number): MealItem {
  return { name: food.name, category: food.category, grams: Math.max(1, Math.round(grams)), per100g: food.per100g };
}
