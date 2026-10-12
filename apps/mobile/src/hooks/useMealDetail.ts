import { itemMacros, parseGrams, roundMacros } from "@calorie/core/nutrition/macros";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toAppError } from "@/services/errors";
import { deleteMeal, getMeal, removeItem, updateItemGrams } from "@/services/mealService";
import { useSession } from "./useSession";

type Change = { kind: "grams"; itemId: string; grams: number } | { kind: "remove"; itemId: string } | { kind: "delete" };

/**
 * One logged meal (FR-017): its items with their nutrition, changing an item's grams, removing an
 * item and deleting the meal. The database recomputes the totals; every change refreshes this
 * meal and the day lists.
 */
export function useMealDetail(mealId: string) {
  const { session, status } = useSession();
  const queryClient = useQueryClient();
  const meal = useQuery({
    queryKey: ["meal", session?.user.id ?? null, mealId],
    queryFn: () => getMeal(mealId),
    enabled: status === "ready",
  });

  const change = useMutation({
    mutationFn: (c: Change) => {
      if (c.kind === "grams") return updateItemGrams(c.itemId, c.grams);
      if (c.kind === "remove") return removeItem(c.itemId);
      return deleteMeal(mealId);
    },
    onSuccess: (_, c) => {
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      if (c.kind === "delete") queryClient.removeQueries({ queryKey: ["meal"] });
      else void queryClient.invalidateQueries({ queryKey: ["meal"] });
    },
  });

  async function run(c: Change): Promise<boolean> {
    if (change.isPending) return false;
    try {
      await change.mutateAsync(c);
      return true;
    } catch {
      return false;
    }
  }

  return {
    meal: meal.data ?? null,
    items: (meal.data?.items ?? []).map((item) => ({ ...item, macros: roundMacros(itemMacros(item)) })),
    loading: meal.isPending,
    loadError: meal.error ? toAppError(meal.error) : null,
    retry: () => void meal.refetch(),
    /** Saves the typed grams for an item; false when they are not valid (see gramsError) or saving failed. */
    changeGrams: (itemId: string, text: string): Promise<boolean> => {
      const grams = parseGrams(text);
      return grams === null ? Promise.resolve(false) : run({ kind: "grams", itemId, grams });
    },
    removeItem: (itemId: string) => run({ kind: "remove", itemId }),
    deleteMeal: () => run({ kind: "delete" }),
    pending: change.isPending,
    error: change.error ? toAppError(change.error) : null,
    resetError: () => change.reset(),
  };
}
