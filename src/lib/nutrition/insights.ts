import type { Macros } from "@/types/nutrition";
import { CALORIE_TOLERANCE } from "./dayRating";
import { getFood, type Food } from "./foods";

/*
 * Rule-based daily summary: compares what was eaten with the targets and suggests a concrete
 * food to close the biggest gap. Pure, so it's easy to test and runs instantly in the browser.
 */

export type InsightTone = "success" | "warning" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail?: string;
}

/** Lean protein sources to suggest, best protein-per-kcal first. */
const PROTEIN_SUGGESTIONS = ["chicken", "tuna", "yogurtGreek", "egg", "lentils"] as const;

const PROTEIN_GAP_MIN_G = 8;

/** The day is "winding down" from this hour on: the summary talks about the whole day. */
export const DAY_END_HOUR = 18;

const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");

/** Grams of `food` that give `protein` g, rounded to a friendly 10 g. */
function gramsForProtein(food: Food, protein: number): number {
  return Math.max(50, Math.round(((protein / food.per100g.protein) * 100) / 10) * 10);
}

/** A protein source whose calories fit what's left of the budget, or the leanest one. */
function proteinSuggestion(gap: number, caloriesLeft: number): string | undefined {
  const options = PROTEIN_SUGGESTIONS.map((id) => getFood(id)).filter((f): f is Food => f !== undefined);
  const withAmounts = options.map((food) => {
    const grams = gramsForProtein(food, gap);
    return { food, grams, kcal: (grams / 100) * food.per100g.calories, protein: (grams / 100) * food.per100g.protein };
  });
  const pick = withAmounts.find((o) => o.kcal <= Math.max(caloriesLeft, 0) + 50) ?? withAmounts[0];
  if (!pick) return undefined;
  return `Örneğin ${fmt(pick.grams)} g ${pick.food.name.toLocaleLowerCase("tr-TR")} ≈ ${fmt(pick.protein)} g protein, ${fmt(pick.kcal)} kcal.`;
}

export interface InsightInput {
  eaten: Macros;
  targets: Macros;
  mealCount: number;
  /** Local hour (0–23). */
  hour: number;
}

export function buildInsights({ eaten, targets, mealCount, hour }: InsightInput): Insight[] {
  if (mealCount === 0) {
    return [
      {
        id: "empty",
        tone: "info",
        title: hour >= DAY_END_HOUR ? "Bugün henüz öğün kaydetmedin" : "Güne başlarken",
        detail: `Hedefin ${fmt(targets.calories)} kcal ve en az ${fmt(targets.protein)} g protein. İlk öğününü fotoğrafla ya da hızlı girişe yaz.`,
      },
    ];
  }

  const insights: Insight[] = [];
  const caloriesLeft = targets.calories - eaten.calories;
  const proteinGap = targets.protein - eaten.protein;
  const lateInDay = hour >= DAY_END_HOUR;

  if (proteinGap >= PROTEIN_GAP_MIN_G) {
    insights.push({
      id: "protein-gap",
      tone: lateInDay ? "warning" : "info",
      title: `Bugün hedefine göre ${fmt(proteinGap)} g protein açığın var`,
      detail: proteinSuggestion(proteinGap, caloriesLeft),
    });
  } else {
    insights.push({ id: "protein-ok", tone: "success", title: "Protein hedefini tamamladın", detail: `${fmt(eaten.protein)} g / ${fmt(targets.protein)} g` });
  }

  if (caloriesLeft < -targets.calories * CALORIE_TOLERANCE) {
    insights.push({
      id: "calories-over",
      tone: "warning",
      title: `Kalori hedefini ${fmt(-caloriesLeft)} kcal aştın`,
      detail: "Günün kalanında sebze ve yağsız protein ağırlıklı, hafif seçimler yapabilirsin.",
    });
  } else if (caloriesLeft > targets.calories * CALORIE_TOLERANCE) {
    insights.push({
      id: "calories-left",
      tone: "info",
      title: `${fmt(caloriesLeft)} kcal hakkın kaldı`,
      detail: lateInDay ? "Akşam öğününü buna göre planla." : `Ortalama bir öğün için yaklaşık ${fmt(Math.min(caloriesLeft, 700))} kcal ayırabilirsin.`,
    });
  } else {
    insights.push({ id: "calories-on-target", tone: "success", title: "Kalori hedefindesin", detail: `${fmt(eaten.calories)} / ${fmt(targets.calories)} kcal` });
  }

  const carbsOver = eaten.carbs - targets.carbs;
  const fatOver = eaten.fat - targets.fat;
  if (carbsOver > targets.carbs * 0.1) {
    insights.push({ id: "carbs-over", tone: "warning", title: `Karbonhidrat ${fmt(carbsOver)} g fazla`, detail: "Sonraki öğünde pilav/ekmek yerine sebze tercih edebilirsin." });
  }
  if (fatOver > targets.fat * 0.1) {
    insights.push({ id: "fat-over", tone: "warning", title: `Yağ ${fmt(fatOver)} g fazla`, detail: "Kızartma ve soslar yerine ızgara veya haşlama seçenekleri dene." });
  }

  // Everything within a few percent: one celebratory line instead of a list.
  if (insights.every((i) => i.tone === "success") && lateInDay) {
    return [{ id: "perfect-day", tone: "success", title: "Harika bir gün!", detail: "Kalori ve protein hedeflerinle uyumlusun." }];
  }
  return insights;
}
