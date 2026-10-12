import { foodHitRowSchema, type FoodHit } from "@calorie/core/schemas/rows";
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
