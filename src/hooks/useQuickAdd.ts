"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SLOT_LABELS } from "@/lib/labels";
import { foodItem, searchFoods } from "@/lib/nutrition/foods";
import { parseGrams } from "@/lib/nutrition/macros";
import { slotForHour } from "@/lib/nutrition/slots";
import { foodService } from "@/services/foodService";
import { errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import type { CustomFood } from "@/types/food";
import type { MealSlot } from "@/types/meal";
import type { Macros, MealItem } from "@/types/nutrition";
import { useAuth } from "./useAuth";
import { useIsClient } from "./useIsClient";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

/** One row of the "Hızlı ekle" list: a built-in food or one of the user's own. */
export interface QuickFood {
  key: string;
  name: string;
  per100g: Macros;
  /** Grams in a typical serving / as printed on the pack; only a hint, never pre-filled. */
  portion: number | null;
  /** Set for the user's own foods (they can be deleted). */
  customId: string | null;
  item: (grams: number) => MealItem;
}

function fromCustom(food: CustomFood): QuickFood {
  return {
    key: `custom:${food.id}`,
    name: food.brand ? `${food.name} (${food.brand})` : food.name,
    per100g: food.per100g,
    portion: food.servingGrams,
    customId: food.id,
    item: (grams) => ({ name: food.name, category: food.category, grams, per100g: food.per100g, micros: food.micros }),
  };
}

function matches(food: CustomFood, q: string): boolean {
  return `${food.name} ${food.brand ?? ""}`.toLocaleLowerCase("tr-TR").includes(q);
}

/**
 * "Hızlı ekle": search the food database plus the user's own foods, pick one, type the grams
 * eaten and log it into a meal slot (with undo). Nothing is logged with an assumed amount. The slot
 * follows the time of day until the user picks one; `pick` is also used by the empty slots in the
 * meal list ("Yiyecek ekle"), which bumps `highlight` so the card flashes. Foods that aren't listed
 * are added through the custom-food dialog (`openCustom`).
 */
export function useQuickAdd() {
  const { user, requireAuth } = useAuth();
  const toast = useToast();
  const isClient = useIsClient();
  const [chosenSlot, setChosenSlot] = useState<MealSlot | null>(null);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [gramText, setGramText] = useState("");
  const [adding, setAdding] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState<{ userId: string; foods: CustomFood[] } | null>(null);
  /** The last added food, for the flying "+kcal" (key changes on every add). */
  const [lastAdded, setLastAdded] = useState<{ foodKey: string; kcal: number; key: number } | null>(null);

  const slot: MealSlot = chosenSlot ?? (isClient ? slotForHour(new Date().getHours()) : "lunch");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    foodService
      .listCustom()
      .then((foods) => !cancelled && setCustom({ userId: user.id, foods }))
      .catch((err: unknown) => console.warn("Custom foods unavailable:", errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const customFoods = useMemo(() => (user && custom?.userId === user.id ? custom.foods : []), [user, custom]);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const own = customFoods.filter((f) => !q || matches(f, q)).map(fromCustom);
    const builtIn = searchFoods(query).map(
      (food): QuickFood => ({ key: food.id, name: food.name, per100g: food.per100g, portion: food.portion, customId: null, item: (g) => foodItem(food, g) }),
    );
    return [...own, ...builtIn];
  }, [query, customFoods]);

  const selected = results.find((r) => r.key === selectedKey) ?? null;
  const grams = parseGrams(gramText);
  const previewKcal = selected && grams ? Math.round((selected.per100g.calories * grams) / 100) : null;

  async function log(food: QuickFood, amount: number) {
    setAdding(true);
    try {
      const meal = await mealService.create({ name: food.name.slice(0, 120), slot, items: [food.item(amount)] });
      invalidateMeals();
      setLastAdded({ foodKey: food.key, kcal: meal.calories, key: Date.now() });
      setSelectedKey(null);
      setGramText("");
      toast.show({
        tone: "success",
        title: `${food.name} eklendi`,
        description: `${SLOT_LABELS[slot]} · ${amount} g · ${meal.calories} kcal`,
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
      setAdding(false);
    }
  }

  const removeCustom = useCallback(
    async (food: QuickFood) => {
      if (!food.customId) return;
      const id = food.customId;
      try {
        await foodService.removeCustom(id);
        setCustom((c) => (c ? { ...c, foods: c.foods.filter((f) => f.id !== id) } : c));
        setSelectedKey(null);
        toast.success(`"${food.name}" ürünlerinden silindi`);
      } catch (err) {
        toast.error("Ürün silinemedi", errorMessage(err));
      }
    },
    [toast],
  );

  return {
    slot,
    setSlot: setChosenSlot,
    query,
    setQuery,
    results,
    selected,
    /** Opens the gram field under a food (tapping it again closes it). */
    select: (key: string) => {
      setSelectedKey((k) => (k === key ? null : key));
      setGramText("");
    },
    gramText,
    setGramText: (v: string) => setGramText(v.replace(/[^\d.,]/g, "").slice(0, 6)),
    gramsValid: grams !== null,
    previewKcal,
    adding,
    lastAdded,
    highlight,
    /** Select a slot from elsewhere (an empty meal slot) and flash the card. */
    pick: (target: MealSlot) => {
      setChosenSlot(target);
      setHighlight((n) => n + 1);
    },
    add: () => {
      if (selected && grams) requireAuth(() => void log(selected, grams));
    },
    removeCustom: (food: QuickFood) => void removeCustom(food),
    customOpen,
    openCustom: () => requireAuth(() => setCustomOpen(true)),
    closeCustom: () => setCustomOpen(false),
    /** After the dialog saved a new food (and logged it): list it and close. */
    onCustomSaved: (food: CustomFood) => {
      setCustom((c) => (user ? { userId: user.id, foods: [food, ...(c?.userId === user.id ? c.foods : [])] } : c));
      setCustomOpen(false);
      setQuery("");
    },
  };
}
