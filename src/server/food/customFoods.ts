import type { CustomFood as CustomFoodRow } from "@prisma/client";
import { categoryFromMacros } from "@/lib/nutrition/foods";
import type { CustomFood, CustomFoodInput } from "@/types/food";
import type { Micros } from "@/types/nutrition";
import { db } from "../db";

/*
 * The user's own foods (typed or read from a label). The only module that touches the CustomFood
 * table; every query is scoped to a user id.
 */

export const MAX_CUSTOM_FOODS = 300;

function toDTO(row: CustomFoodRow): CustomFood {
  const per100g = { calories: row.kcalPer100, protein: row.proteinPer100, carbs: row.carbsPer100, fat: row.fatPer100 };
  const micros: Micros = {};
  if (row.fiberPer100 !== null) micros.fiber = row.fiberPer100;
  if (row.sugarPer100 !== null) micros.sugar = row.sugarPer100;
  if (row.satFatPer100 !== null) micros.satFat = row.satFatPer100;
  if (row.sodiumPer100 !== null) micros.sodium = row.sodiumPer100;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: categoryFromMacros(per100g),
    per100g,
    micros,
    servingGrams: row.servingGrams,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCustomFoods(userId: string): Promise<CustomFood[]> {
  const rows = await db.customFood.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(toDTO);
}

/** Saves a food; "limit" when the user already has MAX_CUSTOM_FOODS. */
export async function createCustomFood(userId: string, input: CustomFoodInput): Promise<CustomFood | "limit"> {
  if ((await db.customFood.count({ where: { userId } })) >= MAX_CUSTOM_FOODS) return "limit";
  const row = await db.customFood.create({
    data: {
      userId,
      name: input.name,
      brand: input.brand || null,
      kcalPer100: input.per100g.calories,
      proteinPer100: input.per100g.protein,
      carbsPer100: input.per100g.carbs,
      fatPer100: input.per100g.fat,
      fiberPer100: input.micros.fiber ?? null,
      sugarPer100: input.micros.sugar ?? null,
      satFatPer100: input.micros.satFat ?? null,
      sodiumPer100: input.micros.sodium ?? null,
      servingGrams: input.servingGrams,
    },
  });
  return toDTO(row);
}

export async function deleteCustomFood(userId: string, id: string): Promise<boolean> {
  const { count } = await db.customFood.deleteMany({ where: { id, userId } });
  return count > 0;
}
