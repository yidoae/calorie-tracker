"use client";

import { useCallback, useEffect, useState } from "react";
import { slotForHour } from "@/lib/nutrition/slots";
import { errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import type { MealDTO, SavedMealDTO } from "@/types/meal";
import { useAuth } from "./useAuth";
import { asMealInput, invalidateMeals, useMealsVersion } from "./useMeals";
import { useToast } from "./useToast";

interface Lists {
  userId: string;
  recent: MealDTO[];
  saved: SavedMealDTO[];
}

/**
 * One-tap logging: the latest distinct meals and the saved templates. Tapping one logs it again
 * now, in the slot that fits the current time (a saved template keeps its own slot).
 */
export function useQuickPicks() {
  const { user, requireAuth } = useAuth();
  const toast = useToast();
  const version = useMealsVersion();
  const [lists, setLists] = useState<Lists | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([mealService.recent(), mealService.listSaved()])
      .then(([recent, saved]) => {
        if (cancelled) return;
        setLists({ userId: user.id, recent, saved });
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [user, version]);

  const current = user && lists?.userId === user.id ? lists : null;

  const log = useCallback(
    (id: string, meal: Pick<MealDTO, "name" | "slot" | "items">, keepSlot: boolean) =>
      requireAuth(() => {
        setBusyId(id);
        const input = { ...asMealInput(meal), slot: keepSlot ? meal.slot : slotForHour(new Date().getHours()) };
        mealService
          .create(input)
          .then((saved) => {
            toast.success(`"${saved.name}" eklendi`, `${saved.calories} kcal günlüğüne eklendi.`);
            invalidateMeals();
          })
          .catch((err: unknown) => toast.error("Öğün eklenemedi", errorMessage(err)))
          .finally(() => setBusyId(null));
      }),
    [requireAuth, toast],
  );

  const removeSaved = useCallback(
    async (meal: SavedMealDTO) => {
      setBusyId(meal.id);
      try {
        await mealService.removeSaved(meal.id);
        toast.success(`"${meal.name}" kayıtlı öğünlerden çıkarıldı`);
        invalidateMeals();
      } catch (err) {
        toast.error("Kayıtlı öğün silinemedi", errorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  return {
    recent: current?.recent ?? [],
    saved: current?.saved ?? [],
    loading: user !== null && current === null && error === null,
    error,
    busyId,
    logRecent: (meal: MealDTO) => log(meal.id, meal, false),
    logSaved: (meal: SavedMealDTO) => log(meal.id, meal, true),
    removeSaved,
  };
}
