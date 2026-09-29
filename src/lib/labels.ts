import type { FoodCategory, MacroKey } from "@/types/nutrition";
import type { DietStyle, MealPattern, PlanGoal, StrengthSplit, TrainingStyle } from "@/types/plan";
import type { BmiCategory } from "./nutrition/energy";

/*
 * Turkish UI labels. The English `label`s in lib/nutrition/energy.ts are deliberately kept: they go
 * into FitBot's prompt and tool results, which the eval set was calibrated on.
 */

export const BMI_LABELS: Record<BmiCategory["tone"], string> = {
  sky: "Zayıf",
  emerald: "Normal",
  amber: "Fazla kilolu",
  red: "Obez",
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: "Protein",
  carb: "Karbonhidrat",
  fat: "Yağ / sos",
  vegetable: "Sebze",
  fruit: "Meyve",
  dairy: "Süt ürünü",
};

export const MACRO_LABELS: Record<MacroKey, string> = {
  calories: "Kalori",
  protein: "Protein",
  carbs: "Karbonhidrat",
  fat: "Yağ",
};

export const GOAL_LABELS: Record<PlanGoal, { title: string; hint: string }> = {
  cut: { title: "Yağ yakımı", hint: "Kalori açığı" },
  maintain: { title: "Formu koruma", hint: "Denge" },
  bulk: { title: "Kas kazanımı", hint: "Kalori fazlası" },
};

export const TRAINING_STYLE_LABELS: Record<TrainingStyle, string> = {
  strength: "Ağırlık / hipertrofi",
  functional: "Fonksiyonel / CrossFit",
  cardio: "Kardiyo / koşu",
  sedentary: "Düşük hareket",
};

export const TRAINING_STYLE_HINTS: Record<TrainingStyle, string> = {
  strength: "Serbest ağırlık, makine, split programlar",
  functional: "WOD, HIIT, karma kondisyon",
  cardio: "Koşu, bisiklet, yüzme",
  sedentary: "Masa başı, düzenli antrenman yok",
};

export const SPLIT_LABELS: Record<StrengthSplit, string> = {
  fullBody: "Full body",
  upperLower: "Upper / Lower",
  ppl: "Push / Pull / Legs",
};

export const DIET_STYLE_LABELS: Record<DietStyle, string> = {
  highProtein: "Yüksek protein dengeli",
  lowCarb: "Düşük karbonhidrat",
  keto: "Ketojenik",
  iifym: "IIFYM (esnek)",
};

export const DIET_STYLE_HINTS: Record<DietStyle, string> = {
  highProtein: "Protein 2,2 g/kg · yağ %25 · kalan karbonhidrat",
  lowCarb: "Protein 2 g/kg · yağ %40",
  keto: "Karbonhidrat ≤30 g · yağ ağırlıklı",
  iifym: "Makrolara uyduğun sürece esnek seçim",
};

export const MEAL_PATTERN_LABELS: Record<MealPattern, { title: string; hint: string }> = {
  classic: { title: "Klasik", hint: "3 ana + 2 ara öğün" },
  if168: { title: "Aralıklı oruç 16:8", hint: "8 saatlik yeme penceresi" },
};

/** Monday-first short weekday names. */
export const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
