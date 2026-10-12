import type { MealSlot } from "./schemas/meal.ts";
import type { MacroKey } from "./schemas/nutrition.ts";
import type { DietStyle, MealPattern, PlanGoal, StrengthSplit, TrainingStyle } from "./schemas/plan.ts";
import type { ActivityLevel } from "./schemas/profile.ts";
import type { BmiCategory } from "./nutrition/energy.ts";

/* Turkish UI labels. */

export const BMI_LABELS: Record<BmiCategory["tone"], string> = {
  sky: "Zayıf",
  emerald: "Normal",
  amber: "Fazla kilolu",
  red: "Obez",
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
  highProtein: "Protein 2,2 g/kg · yağ 1–1,5 g/kg · kalan karbonhidrat",
  lowCarb: "Protein 2,2 g/kg · karbonhidrat ≤100 g · kalan yağ",
  keto: "Protein 2,2 g/kg · karbonhidrat ≤30 g · yağ ağırlıklı",
  iifym: "Aynı makrolar; yemek seçiminde esneklik",
};

/** Activity levels for the first-time setup. */
export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { title: string; hint: string }> = {
  sedentary: { title: "Hareketsiz", hint: "Masa başı, egzersiz yok" },
  light: { title: "Az hareketli", hint: "Haftada 1–3 gün hafif egzersiz" },
  moderate: { title: "Orta", hint: "Haftada 3–5 gün antrenman" },
  active: { title: "Aktif", hint: "Haftada 6–7 gün antrenman" },
  veryActive: { title: "Çok aktif", hint: "Günde iki antrenman ya da fiziksel iş" },
};

export const MEAL_PATTERN_LABELS: Record<MealPattern, { title: string; hint: string }> = {
  classic: { title: "Klasik", hint: "3 ana + 2 ara öğün" },
  if168: { title: "Aralıklı oruç 16:8", hint: "8 saatlik yeme penceresi" },
};

/** Monday-first short weekday names. */
export const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/** Monday-first full weekday names. */
export const WEEKDAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;

/** Month names, January first. */
export const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] as const;

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle yemeği",
  dinner: "Akşam yemeği",
  snack: "Ara öğün",
};
