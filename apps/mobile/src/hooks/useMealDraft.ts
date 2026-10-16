import type { MealSlot } from "@calorie/core/schemas/meal";
import { useSyncExternalStore } from "react";
import type { FoodHit } from "@/services/foodService";
import {
  addFood,
  dismissUnmatched,
  EMPTY_DRAFT,
  fillDraftFromAi,
  removeDraftItem,
  resolveUnmatched,
  setDraftGrams,
  setDraftPortion,
  setDraftSlot,
  type MealDraft,
  type ProposedFood,
} from "./mealLogic";
import type { PortionPick } from "./portionLogic";

/*
 * The meal being logged, shared by the search and review screens. It lives in memory until the
 * meal is saved or cancelled, so a failed save keeps what the user entered (US3 scenario 5).
 */
let draft: MealDraft = EMPTY_DRAFT;
const listeners = new Set<() => void>();

function update(next: MealDraft) {
  draft = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Forgets the draft: after saving, cancelling or signing out. */
export function clearMealDraft(): void {
  update(EMPTY_DRAFT);
}

export function useMealDraft() {
  const current = useSyncExternalStore(subscribe, () => draft);
  return {
    draft: current,
    addFood: (food: FoodHit) => update(addFood(draft, food)),
    setGrams: (key: string, text: string) => update(setDraftGrams(draft, key, text)),
    setPortion: (key: string, pick: PortionPick) => update(setDraftPortion(draft, key, pick)),
    removeItem: (key: string) => update(removeDraftItem(draft, key)),
    setSlot: (slot: MealSlot) => update(setDraftSlot(draft, slot)),
    fillFromAi: (items: readonly ProposedFood[], unmatched: readonly { description: string; grams?: number }[]) => update(fillDraftFromAi(draft, items, unmatched)),
    resolveUnmatched: (key: string, food: FoodHit) => update(resolveUnmatched(draft, key, food)),
    dismissUnmatched: (key: string) => update(dismissUnmatched(draft, key)),
    clear: clearMealDraft,
  };
}
