import { getFood, type Food, type FoodId } from "@/lib/nutrition/foods";

/*
 * Photo-analysis knowledge for the mock vision model: how each food looks on a plate and which
 * dishes exist. Nutrition comes from the shared food database (lib/nutrition/foods.ts).
 */

/** Colour families a food can show up as in a photo. */
export const FOOD_COLORS = ["green", "red", "orange", "yellow", "tan", "brown", "white", "purple"] as const;
export type FoodColor = (typeof FOOD_COLORS)[number];

/** Dominant colour of each food used in a dish; `null` for things you can't see (cooking oil). */
const APPEARANCE: Partial<Record<FoodId, FoodColor | null>> = {
  chicken: "tan",
  friedChicken: "brown",
  salmon: "orange",
  shrimp: "orange",
  steak: "brown",
  beefPatty: "brown",
  bolognese: "red",
  eggFried: "yellow",
  lentils: "brown",
  whiteRice: "white",
  brownRice: "tan",
  spaghetti: "yellow",
  noodles: "yellow",
  fries: "yellow",
  potato: "white",
  sweetPotato: "orange",
  bread: "tan",
  bun: "tan",
  pizza: "orange",
  oats: "tan",
  yogurtGreek: "white",
  cheese: "white",
  broccoli: "green",
  greens: "green",
  greenBeans: "green",
  stirFryVeg: "green",
  avocado: "green",
  tomato: "red",
  redPepper: "red",
  carrot: "orange",
  corn: "yellow",
  banana: "yellow",
  berries: "purple",
  oil: null,
};

interface DishRecipe {
  name: string;
  /** Typical serving, in grams per food. */
  items: [FoodId, number][];
}

const RECIPES: DishRecipe[] = [
  { name: "Izgara tavuk salatası", items: [["chicken", 120], ["greens", 100], ["tomato", 60], ["avocado", 40], ["oil", 10]] },
  { name: "Bolonez soslu spagetti", items: [["spaghetti", 220], ["bolognese", 150], ["cheese", 15]] },
  { name: "Yumurtalı avokado tost", items: [["bread", 70], ["avocado", 80], ["eggFried", 50]] },
  { name: "Cheeseburger ve patates kızartması", items: [["bun", 90], ["beefPatty", 110], ["cheese", 25], ["fries", 120], ["tomato", 30]] },
  { name: "Pilav ve brokoli ile somon", items: [["salmon", 130], ["whiteRice", 150], ["broccoli", 90]] },
  { name: "Orman meyveli süzme yoğurt", items: [["yogurtGreek", 200], ["berries", 80], ["oats", 30]] },
  { name: "Margarita pizza", items: [["pizza", 220], ["greens", 20]] },
  { name: "Muzlu yulaf lapası", items: [["oats", 240], ["banana", 100], ["berries", 30]] },
  { name: "Erişteli dana sote", items: [["steak", 100], ["noodles", 200], ["stirFryVeg", 120], ["oil", 8]] },
  { name: "Sebzeli omlet", items: [["eggFried", 150], ["redPepper", 50], ["broccoli", 40], ["cheese", 20]] },
  { name: "Patates ve taze fasulyeli biftek", items: [["steak", 180], ["potato", 150], ["greenBeans", 90]] },
  { name: "Tavuklu pilav kasesi", items: [["chicken", 130], ["brownRice", 160], ["broccoli", 70], ["carrot", 40]] },
  { name: "Karidesli sebzeli pilav", items: [["shrimp", 120], ["whiteRice", 150], ["stirFryVeg", 100], ["oil", 6]] },
  { name: "Mercimek ve tatlı patates kasesi", items: [["lentils", 150], ["sweetPotato", 150], ["greens", 50]] },
  { name: "Mısırlı ve püreli kızarmış tavuk", items: [["friedChicken", 170], ["corn", 80], ["potato", 100]] },
];

export interface Dish {
  name: string;
  items: { food: Food; grams: number }[];
  /** How much of the visible plate each colour family takes up (sums to 1). */
  appearance: Record<FoodColor, number>;
}

function toDish({ name, items }: DishRecipe): Dish {
  const resolved = items.map(([id, grams]) => {
    const food = getFood(id);
    if (!food) throw new Error(`Unknown food in recipe: ${id}`);
    return { food, grams, color: APPEARANCE[id] ?? null };
  });

  const appearance = Object.fromEntries(FOOD_COLORS.map((c) => [c, 0])) as Record<FoodColor, number>;
  let visible = 0;
  for (const { color, grams } of resolved) {
    if (!color) continue;
    appearance[color] += grams;
    visible += grams;
  }
  for (const color of FOOD_COLORS) appearance[color] /= visible;

  return { name, items: resolved.map(({ food, grams }) => ({ food, grams })), appearance };
}

export const DISHES: Dish[] = RECIPES.map(toDish);
