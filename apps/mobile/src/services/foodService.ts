import { foodByIdRowSchema, foodHitRowSchema, type FoodHit } from "@calorie/core/schemas/rows";
import { toAppError } from "./errors";
import { supabase } from "./supabase";

export type { FoodHit };

const RESULTS = 20;

/**
 * Foods matching `q`, best first (search_foods, FR-012). `q` is the typed text plus its suffix
 * candidates, built with core searchQuery; the database folds Turkish letters and ranks.
 */
export async function search(q: string): Promise<FoodHit[]> {
  const { data, error } = await supabase.rpc("search_foods", { q, max_results: RESULTS });
  if (error) throw toAppError(error);
  return foodHitRowSchema.array().parse(data);
}

/** The foods with these ids (003: the foods an AI analysis proposed), in the order asked. */
export async function byIds(ids: readonly string[]): Promise<FoodHit[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("foods")
    .select("id, name_tr, typical_portion_g, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_portions(unit, grams, position)")
    .in("id", [...ids]);
  if (error) throw toAppError(error);
  const found = new Map(foodByIdRowSchema.array().parse(data).map((f) => [f.foodId, f]));
  return ids.flatMap((id) => found.get(id) ?? []);
}
