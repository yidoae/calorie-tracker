"use client";

import { useCallback, useState, type FormEvent } from "react";
import { errorMessage } from "@/services/http";
import { foodService } from "@/services/foodService";
import { mealService } from "@/services/mealService";
import { barcodeSchema, type FoodProduct } from "@/types/food";
import type { CreateMealInput, MealDraft } from "@/types/meal";
import { useAuth } from "./useAuth";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

export type BarcodePhase =
  | { kind: "closed" }
  | { kind: "scanning" }
  | { kind: "looking"; barcode: string }
  | { kind: "review"; product: FoodProduct; draft: MealDraft }
  | { kind: "saving"; product: FoodProduct; draft: MealDraft };

/** Default portion when the pack doesn't state a serving. */
const DEFAULT_GRAMS = 100;

/** A product as a one-item meal draft, at one serving. */
function draftFor(product: FoodProduct): MealDraft {
  const name = product.brand ? `${product.name} (${product.brand})` : product.name;
  return {
    name: name.slice(0, 120),
    items: [
      {
        name: product.name.slice(0, 80),
        category: product.category,
        grams: Math.round(product.servingGrams ?? DEFAULT_GRAMS),
        per100g: product.per100g,
        micros: product.micros,
      },
    ],
  };
}

/**
 * Packaged food by barcode: scan (or type) → Open Food Facts lookup → portion review → log.
 * Members only; guests see the sign-up panel first.
 */
export function useBarcodeEntry() {
  const { requireAuth } = useAuth();
  const toast = useToast();
  const [phase, setPhase] = useState<BarcodePhase>({ kind: "closed" });
  const [manual, setManual] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const lookup = useCallback(async (barcode: string) => {
    setNotice(null);
    setPhase({ kind: "looking", barcode });
    try {
      const product = await foodService.byBarcode(barcode);
      setPhase({ kind: "review", product, draft: draftFor(product) });
    } catch (err) {
      setPhase({ kind: "scanning" });
      setNotice(errorMessage(err));
    }
  }, []);

  const save = useCallback(
    async (meal: CreateMealInput) => {
      if (phase.kind !== "review") return;
      const { product, draft } = phase;
      setPhase({ kind: "saving", product, draft });
      try {
        const saved = await mealService.create(meal);
        setPhase({ kind: "closed" });
        setManual("");
        toast.success(`"${saved.name}" kaydedildi`, `${saved.calories} kcal günlüğüne eklendi.`);
        invalidateMeals();
      } catch (err) {
        setPhase({ kind: "review", product, draft });
        toast.error("Öğün kaydedilemedi", errorMessage(err));
      }
    },
    [phase, toast],
  );

  const manualValid = barcodeSchema.safeParse(manual.trim()).success;

  return {
    phase,
    notice,
    manual,
    setManual: (value: string) => setManual(value.replace(/\D/g, "").slice(0, 14)),
    manualValid,
    open: () =>
      requireAuth(() => {
        setNotice(null);
        setPhase({ kind: "scanning" });
      }),
    close: () => {
      setPhase({ kind: "closed" });
      setNotice(null);
    },
    onDetected: (barcode: string) => void lookup(barcode),
    submitManual: (e: FormEvent) => {
      e.preventDefault();
      if (manualValid) void lookup(manual.trim());
    },
    rescan: () => {
      setNotice(null);
      setPhase({ kind: "scanning" });
    },
    save,
  };
}
