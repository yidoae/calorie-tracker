"use client";

import { useState, type FormEvent } from "react";
import { SLOT_LABELS } from "@/lib/labels";
import { kcalFromMacros, LABEL_FIELDS, type LabelField } from "@/lib/nutrition/labelParse";
import { parseGrams, round1 } from "@/lib/nutrition/macros";
import { categoryFromMacros } from "@/lib/nutrition/foods";
import { preparePhoto } from "@/lib/photo";
import { foodService } from "@/services/foodService";
import { errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import { customFoodInputSchema, type CustomFood, type CustomFoodInput, type LabelRead } from "@/types/food";
import type { MealSlot } from "@/types/meal";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

/** Whether the typed values are per 100 g or per serving (bars often print only "per bar"). */
export type LabelBasis = "per100g" | "perServing";

type Fields = Record<LabelField | "name" | "brand" | "grams" | "servingGrams", string>;

const EMPTY: Fields = {
  name: "",
  brand: "",
  grams: "",
  servingGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  satFat: "",
  sodium: "",
};

/** "12,5" -> 12.5; empty or not a number -> null. */
function amount(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number.parseFloat(t);
}

const show = (n: number) => String(n).replace(".", ",");

export type LabelState =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "read"; method: LabelRead["method"]; missing: LabelField[] }
  | { kind: "failed"; message: string };

/**
 * The "Kendi ürününü ekle" form: a product that isn't in the list, typed in from its nutrition table
 * or read from a photo of it (the reader fills what it can; unreadable fields are flagged for the
 * user). Saving stores the food for later searches and logs the grams eaten into `slot`.
 */
export function useCustomFoodForm({ initialName, slot, onSaved }: { initialName: string; slot: MealSlot; onSaved: (food: CustomFood) => void }) {
  const toast = useToast();
  const [fields, setFields] = useState<Fields>({ ...EMPTY, name: initialName.trim().slice(0, 80) });
  const [basis, setBasis] = useState<LabelBasis>("per100g");
  const [label, setLabel] = useState<LabelState>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: key === "name" || key === "brand" ? value.slice(0, 80) : value.replace(/[^\d.,]/g, "").slice(0, 7) }));
    setError(null);
  };

  const serving = amount(fields.servingGrams);
  /** Factor that turns the typed values into per-100 g values. */
  const toPer100 = basis === "per100g" ? 1 : serving && serving > 0 ? 100 / serving : null;

  const typed = (key: LabelField) => amount(fields[key]);
  const suggestedKcal = typed("calories") === null ? kcalFromMacros({ protein: typed("protein"), carbs: typed("carbs"), fat: typed("fat") }) : null;

  /** The food as it would be saved, or the first problem with the form. */
  function build(): { food: CustomFoodInput; grams: number } | { problem: string } {
    const grams = parseGrams(fields.grams);
    if (!fields.name.trim()) return { problem: "Ürün adını yaz." };
    if (grams === null) return { problem: "Ne kadar yediğini gram olarak yaz." };
    if (toPer100 === null) return { problem: "Porsiyon başına değer girdiysen porsiyonun kaç gram olduğunu yaz." };
    for (const key of ["calories", "protein", "carbs", "fat"] as const) {
      if (typed(key) === null) return { problem: "Kalori, protein, karbonhidrat ve yağ zorunlu." };
    }
    const per = (key: LabelField) => {
      const v = typed(key);
      return v === null ? undefined : key === "calories" || key === "sodium" ? Math.round(v * toPer100) : round1(v * toPer100);
    };
    const parsed = customFoodInputSchema.safeParse({
      name: fields.name,
      brand: fields.brand.trim() || null,
      per100g: { calories: per("calories"), protein: per("protein"), carbs: per("carbs"), fat: per("fat") },
      micros: { fiber: per("fiber"), sugar: per("sugar"), satFat: per("satFat"), sodium: per("sodium") },
      servingGrams: serving && serving > 0 && serving <= 2000 ? serving : null,
    });
    if (!parsed.success) return { problem: parsed.error.issues[0]?.message ?? "Değerleri kontrol et." };
    return { food: parsed.data, grams };
  }

  async function readLabel(file: File) {
    setLabel({ kind: "reading" });
    setError(null);
    try {
      const result = await foodService.readLabel(await preparePhoto(file));
      const { values } = result;
      setBasis("per100g");
      setFields((f) => {
        const next = { ...f };
        for (const key of LABEL_FIELDS) next[key] = values[key] === null ? "" : show(values[key]);
        if (values.servingGrams !== null) next.servingGrams = show(values.servingGrams);
        if (!next.name.trim() && result.name) next.name = result.name;
        return next;
      });
      const missing = LABEL_FIELDS.filter((key) => values[key] === null);
      setLabel({ kind: "read", method: result.method, missing });
    } catch (err) {
      setLabel({ kind: "failed", message: errorMessage(err) });
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const built = build();
    if ("problem" in built) {
      setError(built.problem);
      return;
    }
    setSaving(true);
    try {
      const food = await foodService.createCustom(built.food);
      const meal = await mealService.create({
        name: food.name,
        slot,
        items: [{ name: food.name, category: categoryFromMacros(food.per100g), grams: built.grams, per100g: food.per100g, micros: food.micros }],
      });
      invalidateMeals();
      toast.success(`${food.name} eklendi`, `${SLOT_LABELS[slot]} · ${built.grams} g · ${meal.calories} kcal. Ürün listene kaydedildi.`);
      onSaved(food);
    } catch (err) {
      toast.error("Kaydedilemedi", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const grams = parseGrams(fields.grams);
  const kcal100 = typed("calories");
  const previewKcal = grams !== null && kcal100 !== null && toPer100 !== null ? Math.round((kcal100 * toPer100 * grams) / 100) : null;

  return {
    fields,
    set,
    basis,
    setBasis,
    label,
    readLabel: (file: File) => void readLabel(file),
    /** Fields the label reader couldn't fill (highlighted until the user types a value). */
    isMissing: (key: LabelField) => label.kind === "read" && label.missing.includes(key) && fields[key] === "",
    suggestedKcal,
    applySuggestedKcal: () => suggestedKcal !== null && set("calories", String(suggestedKcal)),
    previewKcal,
    error,
    saving,
    submit: (e: FormEvent) => void submit(e),
  };
}
