/** Colour families a food can show up as in a photo. */
export const FOOD_COLORS = ["green", "red", "orange", "yellow", "tan", "brown", "white", "purple"] as const;
export type FoodColor = (typeof FOOD_COLORS)[number];

/** Nutrition per 100 g (approximate, prepared as eaten) and how the food looks on a plate. */
interface Ingredient {
  name: string;
  /** Dominant colour on the plate; `null` for things you can't see (cooking oil). */
  color: FoodColor | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const INGREDIENTS = {
  chicken: { name: "grilled chicken", color: "tan", kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  friedChicken: { name: "fried chicken", color: "brown", kcal: 246, protein: 19, carbs: 10, fat: 14 },
  salmon: { name: "salmon", color: "orange", kcal: 206, protein: 22, carbs: 0, fat: 12 },
  shrimp: { name: "shrimp", color: "orange", kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  steak: { name: "steak", color: "brown", kcal: 250, protein: 26, carbs: 0, fat: 15 },
  beefPatty: { name: "beef patty", color: "brown", kcal: 254, protein: 17, carbs: 0, fat: 20 },
  bolognese: { name: "meat sauce", color: "red", kcal: 120, protein: 8, carbs: 7, fat: 7 },
  egg: { name: "egg", color: "yellow", kcal: 196, protein: 14, carbs: 0.8, fat: 15 },
  lentils: { name: "lentils", color: "brown", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  whiteRice: { name: "white rice", color: "white", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  brownRice: { name: "brown rice", color: "tan", kcal: 123, protein: 2.7, carbs: 26, fat: 1 },
  spaghetti: { name: "spaghetti", color: "yellow", kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  noodles: { name: "egg noodles", color: "yellow", kcal: 138, protein: 4.5, carbs: 25, fat: 2.1 },
  fries: { name: "fries", color: "yellow", kcal: 312, protein: 3.4, carbs: 41, fat: 15 },
  potato: { name: "potatoes", color: "white", kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  sweetPotato: { name: "sweet potato", color: "orange", kcal: 90, protein: 2, carbs: 21, fat: 0.1 },
  bread: { name: "toast", color: "tan", kcal: 250, protein: 12.5, carbs: 43, fat: 3.5 },
  bun: { name: "bun", color: "tan", kcal: 270, protein: 9, carbs: 49, fat: 4 },
  pizza: { name: "pizza", color: "orange", kcal: 266, protein: 11, carbs: 33, fat: 10 },
  oats: { name: "oatmeal", color: "tan", kcal: 71, protein: 2.5, carbs: 12, fat: 1.5 },
  yogurt: { name: "Greek yogurt", color: "white", kcal: 97, protein: 9, carbs: 3.9, fat: 5 },
  cheese: { name: "cheese", color: "white", kcal: 280, protein: 22, carbs: 2.2, fat: 22 },
  broccoli: { name: "broccoli", color: "green", kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  greens: { name: "mixed greens", color: "green", kcal: 17, protein: 1.5, carbs: 3, fat: 0.2 },
  greenBeans: { name: "green beans", color: "green", kcal: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  stirFryVeg: { name: "stir-fried vegetables", color: "green", kcal: 65, protein: 2.5, carbs: 10, fat: 2 },
  avocado: { name: "avocado", color: "green", kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  tomato: { name: "tomato", color: "red", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  redPepper: { name: "red pepper", color: "red", kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  carrot: { name: "carrots", color: "orange", kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  corn: { name: "corn", color: "yellow", kcal: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  banana: { name: "banana", color: "yellow", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  berries: { name: "berries", color: "purple", kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  oil: { name: "olive oil", color: null, kcal: 884, protein: 0, carbs: 0, fat: 100 },
} satisfies Record<string, Ingredient>;

type IngredientId = keyof typeof INGREDIENTS;

interface DishRecipe {
  name: string;
  /** Typical serving, in grams per ingredient. */
  items: [IngredientId, number][];
}

const RECIPES: DishRecipe[] = [
  { name: "Grilled chicken salad", items: [["chicken", 120], ["greens", 100], ["tomato", 60], ["avocado", 40], ["oil", 10]] },
  { name: "Spaghetti bolognese", items: [["spaghetti", 220], ["bolognese", 150], ["cheese", 15]] },
  { name: "Avocado toast with egg", items: [["bread", 70], ["avocado", 80], ["egg", 50]] },
  { name: "Cheeseburger and fries", items: [["bun", 90], ["beefPatty", 110], ["cheese", 25], ["fries", 120], ["tomato", 30]] },
  { name: "Salmon with rice and broccoli", items: [["salmon", 130], ["whiteRice", 150], ["broccoli", 90]] },
  { name: "Greek yogurt with berries", items: [["yogurt", 200], ["berries", 80], ["oats", 30]] },
  { name: "Margherita pizza", items: [["pizza", 220], ["greens", 20]] },
  { name: "Oatmeal with banana", items: [["oats", 240], ["banana", 100], ["berries", 30]] },
  { name: "Beef stir-fry with noodles", items: [["steak", 100], ["noodles", 200], ["stirFryVeg", 120], ["oil", 8]] },
  { name: "Veggie omelette", items: [["egg", 150], ["redPepper", 50], ["broccoli", 40], ["cheese", 20]] },
  { name: "Steak with potatoes and green beans", items: [["steak", 180], ["potato", 150], ["greenBeans", 90]] },
  { name: "Chicken and rice bowl", items: [["chicken", 130], ["brownRice", 160], ["broccoli", 70], ["carrot", 40]] },
  { name: "Shrimp and vegetable rice", items: [["shrimp", 120], ["whiteRice", 150], ["stirFryVeg", 100], ["oil", 6]] },
  { name: "Lentil and sweet potato bowl", items: [["lentils", 150], ["sweetPotato", 150], ["greens", 50]] },
  { name: "Fried chicken with corn and mash", items: [["friedChicken", 170], ["corn", 80], ["potato", 100]] },
];

export interface Dish {
  name: string;
  items: { ingredient: Ingredient; grams: number }[];
  /** How much of the visible plate each colour family takes up (sums to 1). */
  appearance: Record<FoodColor, number>;
}

function toDish({ name, items }: DishRecipe): Dish {
  const resolved = items.map(([id, grams]) => ({ ingredient: INGREDIENTS[id] as Ingredient, grams }));

  const appearance = Object.fromEntries(FOOD_COLORS.map((c) => [c, 0])) as Record<FoodColor, number>;
  let visible = 0;
  for (const { ingredient, grams } of resolved) {
    if (!ingredient.color) continue;
    appearance[ingredient.color] += grams;
    visible += grams;
  }
  for (const color of FOOD_COLORS) appearance[color] /= visible;

  return { name, items: resolved, appearance };
}

export const DISHES: Dish[] = RECIPES.map(toDish);
