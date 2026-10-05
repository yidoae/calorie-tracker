"use client";

import { useState } from "react";
import { SLOT_LABELS } from "@/lib/labels";
import { foodItem, searchFoods, type Food } from "@/lib/nutrition/foods";
import { slotForHour } from "@/lib/nutrition/slots";
import { mealService } from "@/services/mealService";
import { errorMessage } from "@/services/http";
import type { MealSlot } from "@/types/meal";
import { useAuth } from "./useAuth";
import { useIsClient } from "./useIsClient";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

/** kcal in one typical portion of a food. */
export const portionKcal = (food: Food) => Math.round((food.per100g.calories * food.portion) / 100);

/**
 * "Hızlı ekle": search the food database and log one portion into a meal slot with a single tap
 * (with undo). The slot follows the time of day until the user picks one; `pick` is also used by
 * the empty slots in the meal list ("Yiyecek ekle"), which bumps `highlight` so the card flashes.
 */
export function useQuickAdd() {
  const { requireAuth } = useAuth();
  const toast = useToast();
  const isClient = useIsClient();
  const [chosenSlot, setChosenSlot] = useState<MealSlot | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  /** The last added food, for the flying "+kcal" (key changes on every add). */
  const [lastAdded, setLastAdded] = useState<{ foodId: string; kcal: number; key: number } | null>(null);

  const slot: MealSlot = chosenSlot ?? (isClient ? slotForHour(new Date().getHours()) : "lunch");

  async function log(food: Food) {
    setAdding(food.id);
    try {
      const meal = await mealService.create({ name: food.name, slot, items: [foodItem(food, food.portion)] });
      invalidateMeals();
      setLastAdded({ foodId: food.id, kcal: meal.calories, key: Date.now() });
      toast.show({
        tone: "success",
        title: `${food.name} eklendi`,
        description: `${SLOT_LABELS[slot]} · ${meal.calories} kcal`,
        action: {
          label: "Geri al",
          onClick: () =>
            void mealService
              .remove(meal.id)
              .catch((err: unknown) => toast.error("Geri alınamadı", errorMessage(err)))
              .finally(invalidateMeals),
        },
      });
    } catch (err) {
      toast.error("Eklenemedi", errorMessage(err));
    } finally {
      setAdding(null);
    }
  }

  return {
    slot,
    setSlot: setChosenSlot,
    query,
    setQuery,
    /** Matching foods with the kcal of one typical portion. */
    results: searchFoods(query).map((food) => ({ food, kcal: portionKcal(food) })),
    adding,
    lastAdded,
    highlight,
    /** Select a slot from elsewhere (an empty meal slot) and flash the card. */
    pick: (target: MealSlot) => {
      setChosenSlot(target);
      setHighlight((n) => n + 1);
    },
    add: (food: Food) => requireAuth(() => void log(food)),
  };
}
