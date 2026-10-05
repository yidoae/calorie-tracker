import type { Meal, MealItem as MealItemRow, SavedMeal } from "@prisma/client";
import { totalOfItems } from "@/lib/nutrition/macros";
import { mealSlotSchema, type CreateMealInput, type MealDTO, type SavedMealDTO, type UpdateMealInput } from "@/types/meal";
import { foodCategorySchema, mealItemSchema, type MealItem, type Micros } from "@/types/nutrition";
import { z } from "@/types/zod";
import { db } from "../db";
import { deleteImage } from "../storage";

/*
 * Meal data access. The only module that reads or writes the Meal/MealItem/SavedMeal tables; every
 * query is scoped to a user id, so one account can never see or change another's meals.
 */

const withItems = { items: { orderBy: { position: "asc" } } } as const;

function toMicros(row: MealItemRow): Micros | undefined {
  const micros: Micros = {};
  if (row.fiberPer100 !== null) micros.fiber = row.fiberPer100;
  if (row.sugarPer100 !== null) micros.sugar = row.sugarPer100;
  if (row.satFatPer100 !== null) micros.satFat = row.satFatPer100;
  if (row.sodiumPer100 !== null) micros.sodium = row.sodiumPer100;
  return Object.keys(micros).length > 0 ? micros : undefined;
}

function toItem(row: MealItemRow): MealItem {
  return {
    name: row.name,
    category: foodCategorySchema.catch("carb").parse(row.category),
    grams: row.grams,
    per100g: { calories: row.kcalPer100, protein: row.proteinPer100, carbs: row.carbsPer100, fat: row.fatPer100 },
    micros: toMicros(row),
  };
}

function itemRows(items: MealItem[]) {
  return items.map((item, position) => ({
    position,
    name: item.name,
    category: item.category,
    grams: item.grams,
    kcalPer100: item.per100g.calories,
    proteinPer100: item.per100g.protein,
    carbsPer100: item.per100g.carbs,
    fatPer100: item.per100g.fat,
    fiberPer100: item.micros?.fiber ?? null,
    sugarPer100: item.micros?.sugar ?? null,
    satFatPer100: item.micros?.satFat ?? null,
    sodiumPer100: item.micros?.sodium ?? null,
  }));
}

export function toMealDTO(meal: Meal & { items: MealItemRow[] }): MealDTO {
  const { id, name, calories, protein, carbs, fat, imageUrl, createdAt } = meal;
  return {
    id,
    name,
    calories,
    protein,
    carbs,
    fat,
    imageUrl,
    slot: mealSlotSchema.catch("snack").parse(meal.slot),
    createdAt: createdAt.toISOString(),
    items: meal.items.map(toItem),
  };
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

const RECENT_DAYS = 60;
const RECENT_SCAN = 150;

/**
 * The user's most recently logged distinct meals, newest first, for one-tap re-logging. Meals are
 * the same when name and components match (quick-bar meals are often named after the slot).
 */
export async function listRecentMeals(userId: string, limit: number): Promise<MealDTO[]> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const meals = await db.meal.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: RECENT_SCAN,
    include: withItems,
  });
  const seen = new Set<string>();
  const distinct: MealDTO[] = [];
  for (const meal of meals) {
    const key = [meal.name.toLocaleLowerCase("tr-TR"), ...meal.items.map((i) => `${i.name}:${i.grams}`)].join("|");
    if (seen.has(key) || meal.items.length === 0) continue;
    seen.add(key);
    distinct.push(toMealDTO(meal));
    if (distinct.length >= limit) break;
  }
  return distinct;
}

/** Logs a meal. Totals are always recomputed from the items here, never taken from the client. */
export async function createMeal(userId: string, input: CreateMealInput, imageUrl: string | null): Promise<MealDTO> {
  const meal = await db.meal.create({
    data: {
      userId,
      name: input.name,
      slot: input.slot,
      imageUrl,
      ...(input.loggedAt ? { createdAt: new Date(input.loggedAt) } : {}),
      ...totalOfItems(input.items),
      items: { create: itemRows(input.items) },
    },
    include: withItems,
  });
  return toMealDTO(meal);
}

/** Replaces the user's meal's name, slot and items (totals recomputed). Null if there's no such meal. */
export async function updateMeal(userId: string, id: string, input: UpdateMealInput): Promise<MealDTO | null> {
  const owned = await db.meal.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return null;
  const [, meal] = await db.$transaction([
    db.mealItem.deleteMany({ where: { mealId: id } }),
    db.meal.update({
      where: { id },
      data: { name: input.name, slot: input.slot, ...totalOfItems(input.items), items: { create: itemRows(input.items) } },
      include: withItems,
    }),
  ]);
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

/** Every photo the user uploaded (for account deletion). */
export async function listImageUrls(userId: string): Promise<string[]> {
  const rows = await db.meal.findMany({ where: { userId, imageUrl: { not: null } }, select: { imageUrl: true } });
  return rows.flatMap((r) => (r.imageUrl ? [r.imageUrl] : []));
}

/** All of the user's meals, oldest first (for the data export). */
export async function listAllMeals(userId: string): Promise<MealDTO[]> {
  const meals = await db.meal.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, include: withItems });
  return meals.map(toMealDTO);
}

// Saved meals (templates). Items are stored as JSON and re-validated on read.

const MAX_SAVED_MEALS = 50;
const storedItemsSchema = z.array(mealItemSchema).min(1).max(30);

function toSavedMealDTO(row: SavedMeal): SavedMealDTO | null {
  let raw: unknown;
  try {
    raw = JSON.parse(row.items);
  } catch {
    return null;
  }
  const items = storedItemsSchema.safeParse(raw);
  if (!items.success) return null;
  return {
    id: row.id,
    name: row.name,
    slot: mealSlotSchema.catch("snack").parse(row.slot),
    items: items.data,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSavedMeals(userId: string): Promise<SavedMealDTO[]> {
  const rows = await db.savedMeal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(toSavedMealDTO).filter((m): m is SavedMealDTO => m !== null);
}

/** Saves a template; "limit" when the user already has the maximum number. */
export async function createSavedMeal(userId: string, input: CreateMealInput): Promise<SavedMealDTO | "limit"> {
  if ((await db.savedMeal.count({ where: { userId } })) >= MAX_SAVED_MEALS) return "limit";
  const row = await db.savedMeal.create({
    data: { userId, name: input.name, slot: input.slot, items: JSON.stringify(input.items) },
  });
  const dto = toSavedMealDTO(row);
  if (!dto) throw new Error("Saved meal failed its own schema");
  return dto;
}

export async function deleteSavedMeal(userId: string, id: string): Promise<boolean> {
  const { count } = await db.savedMeal.deleteMany({ where: { id, userId } });
  return count > 0;
}
