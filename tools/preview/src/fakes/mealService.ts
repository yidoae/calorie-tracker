// Preview stand-in for apps/mobile/src/services/mealService.ts: a sample day with breakfast and
// lunch (totals as the database computes them from the items), no network. Changes only wait.
import type * as Meals from "@/services/mealService";

const wait = () => new Promise((resolve) => setTimeout(resolve, 900));

const item = (id: string, position: number, foodId: string, name: string, grams: number, calories: number, protein: number, carbs: number, fat: number) => ({
  id,
  position,
  foodId,
  name,
  grams,
  per100g: { calories, protein, carbs, fat },
});

export const SAMPLE_MEALS: Meals.Meal[] = [
  {
    id: "00000000-0000-4000-8000-0000000000b1",
    slot: "breakfast",
    localDate: "2026-10-11",
    timeZone: "Europe/Istanbul",
    loggedAt: "2026-10-11T05:40:00.000Z",
    name: "Yumurta, simit",
    totals: { calories: 551, protein: 25, carbs: 70.7, fat: 18.8 },
    items: [
      item("00000000-0000-4000-8000-0000000000c1", 0, "egg", "Yumurta", 100, 155, 13, 1.1, 11),
      item("00000000-0000-4000-8000-0000000000c2", 1, "simit", "Simit", 120, 330, 10, 58, 6.5),
    ],
  },
  {
    id: "00000000-0000-4000-8000-0000000000b2",
    slot: "lunch",
    localDate: "2026-10-11",
    timeZone: "Europe/Istanbul",
    loggedAt: "2026-10-11T10:15:00.000Z",
    name: "Izgara tavuk göğsü, pirinç pilavı, yoğurt",
    totals: { calories: 616.5, protein: 71.3, carbs: 49.1, fat: 12.6 },
    items: [
      item("00000000-0000-4000-8000-0000000000c3", 0, "chicken_breast_grilled", "Izgara tavuk göğsü", 200, 165, 31, 0, 3.6),
      item("00000000-0000-4000-8000-0000000000c4", 1, "white_rice", "Pirinç pilavı", 150, 130, 2.7, 28, 0.3),
      item("00000000-0000-4000-8000-0000000000c5", 2, "yogurt", "Yoğurt", 150, 61, 3.5, 4.7, 3.3),
    ],
  },
];

export async function logMeal(payload: Parameters<typeof Meals.logMeal>[0]): ReturnType<typeof Meals.logMeal> {
  await wait();
  return { id: "00000000-0000-4000-8000-0000000000b9", slot: payload.slot, localDate: payload.localDate, totals: { calories: 495, protein: 62, carbs: 0, fat: 7.2 } };
}

export async function getDayMeals(_localDate: string): ReturnType<typeof Meals.getDayMeals> {
  return SAMPLE_MEALS;
}

export async function getMeal(mealId: string): ReturnType<typeof Meals.getMeal> {
  return SAMPLE_MEALS.find((meal) => meal.id === mealId) ?? null;
}

export async function updateItemGrams(_itemId: string, _grams: number): Promise<void> {
  await wait();
}

export async function removeItem(_itemId: string): Promise<void> {
  await wait();
}

export async function deleteMeal(_mealId: string): Promise<void> {
  await wait();
}
