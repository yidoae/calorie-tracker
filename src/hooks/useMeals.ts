"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import type { CreateMealInput, MealDTO, UpdateMealInput } from "@/types/meal";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

/*
 * Meal data for the UI. Lists are fetched per date range; any mutation bumps a shared version
 * number so every visible list (today, the calendar month) refetches, without prop drilling.
 */

let mealsVersion = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
/** Tell every meal list to refetch. */
export function invalidateMeals() {
  mealsVersion += 1;
  listeners.forEach((l) => l());
}

interface RangeState {
  key: string;
  meals: MealDTO[];
  error: string | null;
}

/** The signed-in user's meals with `from <= createdAt < to`, newest first. Guests get []. */
export function useMealsInRange(from: Date, to: Date) {
  const { status, user } = useAuth();
  const version = useSyncExternalStore(subscribe, () => mealsVersion, () => 0);
  const key = `${user?.id ?? "guest"}|${from.toISOString()}|${to.toISOString()}`;
  const [state, setState] = useState<RangeState | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    const load = user ? mealService.list(from, to) : Promise.resolve([]);
    load
      .then((meals) => !cancelled && setState({ key, meals, error: null }))
      .catch((err: unknown) => !cancelled && setState({ key, meals: [], error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
    // `key` already encodes `from`, `to` and the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version, status]);

  // While refetching the same range, keep showing the previous data (no skeleton flash).
  const current = state?.key === key ? state : null;
  return { meals: current?.meals ?? [], loading: current === null, error: current?.error ?? null };
}

function todayRange(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

/** Today's meals, using the browser's local-day boundaries. */
export function useTodayMeals() {
  const { from, to } = useMemo(() => todayRange(), []);
  return useMealsInRange(from, to);
}

/** The version counter, for other hooks that should refetch when meals change. */
export function useMealsVersion(): number {
  return useSyncExternalStore(subscribe, () => mealsVersion, () => 0);
}

/** A meal as input for logging again or saving as a template. */
export const asMealInput = (meal: Pick<MealDTO, "name" | "slot" | "items">): CreateMealInput => ({
  name: meal.name,
  slot: meal.slot,
  items: meal.items,
});

/** Editing, deleting and templating meals, with toasts; lists refresh automatically. */
export function useMealActions() {
  const toast = useToast();

  const update = useCallback(
    async (id: string, input: UpdateMealInput): Promise<boolean> => {
      try {
        const saved = await mealService.update(id, input);
        toast.success(`"${saved.name}" güncellendi`, `${saved.calories} kcal`);
        invalidateMeals();
        return true;
      } catch (err) {
        toast.error("Öğün güncellenemedi", errorMessage(err));
        return false;
      }
    },
    [toast],
  );

  const saveAsTemplate = useCallback(
    async (meal: MealDTO) => {
      try {
        await mealService.saveTemplate(asMealInput(meal));
        toast.success(`"${meal.name}" kayıtlı öğünlere eklendi`, "Hızlı girişin altından tek dokunuşla ekleyebilirsin.");
        invalidateMeals();
      } catch (err) {
        toast.error("Öğün kaydedilemedi", errorMessage(err));
      }
    },
    [toast],
  );

  const remove = useCallback(
    async (meal: Pick<MealDTO, "id" | "name">) => {
      try {
        await mealService.remove(meal.id);
        toast.success(`"${meal.name}" silindi`);
      } catch (err) {
        toast.error("Öğün silinemedi", errorMessage(err));
      } finally {
        invalidateMeals();
      }
    },
    [toast],
  );

  const clearDay = useCallback(
    async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => mealService.remove(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) toast.error(`${failed} öğün silinemedi`, "Tekrar dene.");
      else toast.success("Gün temizlendi");
      invalidateMeals();
    },
    [toast],
  );

  /**
   * Deletes one component of a meal (the whole meal if it was the last one), with "Geri al".
   * Undo puts the meal back as it was; a deleted meal with a photo can't be restored, so it gets
   * no undo button.
   */
  const removeItem = useCallback(
    async (meal: MealDTO, index: number) => {
      const item = meal.items[index];
      if (!item) return;
      try {
        if (meal.items.length <= 1) {
          await mealService.remove(meal.id);
          toast.show({
            tone: "success",
            title: `${item.name} silindi`,
            action: meal.imageUrl
              ? undefined
              : {
                  label: "Geri al",
                  onClick: () =>
                    void mealService
                      .create({ ...asMealInput(meal), loggedAt: meal.createdAt })
                      .catch((err: unknown) => toast.error("Geri alınamadı", errorMessage(err)))
                      .finally(invalidateMeals),
                },
          });
        } else {
          await mealService.update(meal.id, { ...asMealInput(meal), items: meal.items.filter((_, i) => i !== index) });
          toast.show({
            tone: "success",
            title: `${item.name} silindi`,
            action: {
              label: "Geri al",
              onClick: () =>
                void mealService
                  .update(meal.id, asMealInput(meal))
                  .catch((err: unknown) => toast.error("Geri alınamadı", errorMessage(err)))
                  .finally(invalidateMeals),
            },
          });
        }
      } catch (err) {
        toast.error("Silinemedi", errorMessage(err));
      } finally {
        invalidateMeals();
      }
    },
    [toast],
  );

  return { update, remove, removeItem, clearDay, saveAsTemplate };
}
