import { monthBounds } from "@calorie/core/dates";
import { gramsSchema } from "@calorie/core/schemas/nutrition";
import { logMealPayloadSchema, type LogMealPayload, type Meal } from "@calorie/core/schemas/meal";
import { loggedMealRowSchema, mealKcalRowSchema, mealRowSchema, type LoggedMeal, type MealKcal } from "@calorie/core/schemas/rows";
import { appError, toAppError } from "./errors";
import { supabase } from "./supabase";

export type { LoggedMeal, Meal, MealKcal };

/*
 * Meals (US3, contracts/database-api.md). A new meal and its items are saved in one step by
 * log_meal; items are changed and meals deleted through the tables under RLS. The app sends foods
 * and grams only: the database copies the per-100 g values and computes every total (FR-015).
 */

/** A meal with its items and their food names, items in position order. */
const MEAL_WITH_ITEMS = "*, meal_items(*, foods(name_tr))";

/** Saves a meal with its items; returns it with the totals the database computed. */
export async function logMeal(payload: LogMealPayload): Promise<LoggedMeal> {
  const p = logMealPayloadSchema.parse(payload);
  const { data, error } = await supabase.rpc("log_meal", {
    slot: p.slot,
    local_date: p.localDate,
    time_zone: p.timeZone,
    name: p.name,
    items: p.items,
  });
  if (error) throw toAppError(error);
  return loggedMealRowSchema.parse(data);
}

/** The signed-in user's meals on a local day (FR-016), in the order they were logged. */
export async function getDayMeals(localDate: string): Promise<Meal[]> {
  const { data, error } = await supabase.from("meals").select(MEAL_WITH_ITEMS).eq("local_date", localDate).order("logged_at");
  if (error) throw toAppError(error);
  return mealRowSchema.array().parse(data);
}

/** Every meal's day and calories in the month `month` falls in (FR-019); the app sums and rates the days. */
export async function getMonthTotals(month: Date): Promise<MealKcal[]> {
  const { from, to } = monthBounds(month);
  const { data, error } = await supabase.from("meals").select("local_date, total_kcal").gte("local_date", from).lte("local_date", to);
  if (error) throw toAppError(error);
  return mealKcalRowSchema.array().parse(data);
}

/** One of the user's meals; null when it does not exist (or is someone else's: RLS hides it). */
export async function getMeal(mealId: string): Promise<Meal | null> {
  const { data, error } = await supabase.from("meals").select(MEAL_WITH_ITEMS).eq("id", mealId).maybeSingle();
  if (error) throw toAppError(error);
  return data === null ? null : mealRowSchema.parse(data);
}

/** Changes an item's grams (FR-017); the meal's totals are recomputed by the database. */
export async function updateItemGrams(itemId: string, grams: number): Promise<void> {
  const { data, error } = await supabase.from("meal_items").update({ grams: gramsSchema.parse(grams) }).eq("id", itemId).select("id");
  if (error) throw toAppError(error);
  if (data.length === 0) throw appError("meal_not_found");
}

/** Removes an item from its meal (FR-017); a meal may be left without items, which the app offers to delete. */
export async function removeItem(itemId: string): Promise<void> {
  const { data, error } = await supabase.from("meal_items").delete().eq("id", itemId).select("id");
  if (error) throw toAppError(error);
  if (data.length === 0) throw appError("meal_not_found");
}

/** Deletes a meal and its items (FR-017). */
export async function deleteMeal(mealId: string): Promise<void> {
  const { data, error } = await supabase.from("meals").delete().eq("id", mealId).select("id");
  if (error) throw toAppError(error);
  if (data.length === 0) throw appError("meal_not_found");
}
