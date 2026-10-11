import { LOCALE } from "@calorie/core/dates";
import { SLOT_LABELS } from "@calorie/core/labels";
import { slotForHour } from "@calorie/core/nutrition/slots";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toAppError } from "@/services/errors";
import { logMeal } from "@/services/mealService";
import { draftItemMacros, draftReady, draftTotals, logMealPayload } from "./mealLogic";
import { useMealDraft } from "./useMealDraft";
import { useToast } from "./useToast";
import { useToday } from "./useToday";

/**
 * The review step (FR-013, FR-014): the draft with an empty gram field per food, live totals from
 * the per-100 g values, the slot (defaulting from the time of day) and saving through log_meal.
 * A failed save keeps the draft and says why in Turkish; a saved meal clears it and refreshes the
 * day, so the dashboard shows it right away.
 */
export function useLogMeal() {
  const { draft, setGrams, removeItem, setSlot, clear } = useMealDraft();
  const day = useToday();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [defaultSlot] = useState(() => slotForHour(new Date().getHours()));
  // Gram errors show once the user tries to save, not while the fields are still empty.
  const [showErrors, setShowErrors] = useState(false);

  const mutation = useMutation({
    mutationFn: logMeal,
    onSuccess: (meal) => {
      clear();
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast.show("success", "Öğün kaydedildi", `${SLOT_LABELS[meal.slot]} · ${Math.round(meal.totals.calories).toLocaleString(LOCALE)} kcal`);
    },
  });

  /** Saves the meal; true when it was saved. */
  async function save(): Promise<boolean> {
    if (mutation.isPending) return false;
    const payload = logMealPayload(draft, defaultSlot, day);
    if (!payload) {
      setShowErrors(true);
      return false;
    }
    try {
      await mutation.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  }

  return {
    items: draft.items.map((item) => ({ ...item, macros: draftItemMacros(item) })),
    slot: draft.slot ?? defaultSlot,
    totals: draftTotals(draft),
    ready: draftReady(draft),
    showErrors,
    setGrams,
    removeItem,
    setSlot,
    save,
    /** Leaves without saving: the draft is dropped. */
    cancel: clear,
    pending: mutation.isPending,
    error: mutation.error ? toAppError(mutation.error) : null,
  };
}
