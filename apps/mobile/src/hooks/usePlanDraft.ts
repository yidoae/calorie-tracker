import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { useSyncExternalStore } from "react";

/*
 * The plan the wizard built, handed to the review screen. It lives in memory until the next wizard
 * plan replaces it or the user signs out; the review screen tunes a copy of it. It is kept after
 * saving, so the review screen does not flash empty while it closes.
 */
let draft: NutritionPlan | null = null;
const listeners = new Set<() => void>();

function update(next: NutritionPlan | null) {
  draft = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPlanDraft(plan: NutritionPlan): void {
  update(plan);
}

/** Forgets the draft when the user signs out. */
export function clearPlanDraft(): void {
  update(null);
}

export function usePlanDraft(): NutritionPlan | null {
  return useSyncExternalStore(subscribe, () => draft);
}
