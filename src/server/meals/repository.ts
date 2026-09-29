import type { Meal, MealItem as MealItemRow } from "@prisma/client";
import { totalOfItems } from "@/lib/nutrition/macros";
import type { CreateMealInput, MealDTO } from "@/types/meal";
import { foodCategorySchema, type MealItem } from "@/types/nutrition";
import { db } from "../db";
import { deleteImage } from "../storage";

/*
 * Meal data access. The only module that reads or writes the Meal/MealItem tables; every query
 * is scoped to a user id, so one account can never see or change another's meals.
 */

const withItems = { items: { orderBy: { position: "asc" } } } as const;

function toItem(row: MealItemRow): MealItem {
  return {
    name: row.name,
    category: foodCategorySchema.catch("carb").parse(row.category),
    grams: row.grams,
    per100g: { calories: row.kcalPer100, protein: row.proteinPer100, carbs: row.carbsPer100, fat: row.fatPer100 },
  };
}

export function toMealDTO(meal: Meal & { items: MealItemRow[] }): MealDTO {
  const { id, name, calories, protein, carbs, fat, imageUrl, createdAt } = meal;
  return { id, name, calories, protein, carbs, fat, imageUrl, createdAt: createdAt.toISOString(), items: meal.items.map(toItem) };
}

/** The user's meals with `from <= createdAt < to`, newest first. */
export async function listMeals(userId: string, from: Date, to: Date): Promise<MealDTO[]> {
  const meals = await db.meal.findMany({
    where: { userId, createdAt: { gte: from, lt: to } },
    orderBy: { createdAt: "desc" },
    include: withItems,
  });
  return meals.map(toMealDTO);
}

/** Logs a meal. Totals are always recomputed from the items here, never taken from the client. */
export async function createMeal(userId: string, input: CreateMealInput, imageUrl: string | null): Promise<MealDTO> {
  const totals = totalOfItems(input.items);
  const meal = await db.meal.create({
    data: {
      userId,
      name: input.name,
      imageUrl,
      ...totals,
      items: {
        create: input.items.map((item, position) => ({
          position,
          name: item.name,
          category: item.category,
          grams: item.grams,
          kcalPer100: item.per100g.calories,
          proteinPer100: item.per100g.protein,
          carbsPer100: item.per100g.carbs,
          fatPer100: item.per100g.fat,
        })),
      },
    },
    include: withItems,
  });
  return toMealDTO(meal);
}

/** Deletes the user's meal and its photo. False if there's no such meal for this user. */
export async function deleteMeal(userId: string, id: string): Promise<boolean> {
  const meal = await db.meal.findUnique({ where: { id }, select: { userId: true, imageUrl: true } });
  if (!meal || meal.userId !== userId) return false;
  await db.meal.delete({ where: { id } });
  await deleteImage(meal.imageUrl);
  return true;
}

/** Whether this photo belongs to one of the user's meals. */
export async function ownsImage(userId: string, imageUrl: string): Promise<boolean> {
  return (await db.meal.count({ where: { userId, imageUrl } })) > 0;
}
