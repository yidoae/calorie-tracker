import { DIET_STYLE_LABELS, TRAINING_STYLE_LABELS } from "@/lib/labels";
import type { CustomPlan, Profile } from "@/types/profile";
import { PROTEIN_PER_KG, type DayTargets, type DietStyle, type NutritionPlan, type PlanInputs, type TrainingStyle } from "@/types/plan";

/*
 * Plan math: Harris-Benedict BMR, activity from the training routine, goal adjustment, the
 * high-protein macro engine (protein 2.2 g/kg, fat 1.0–1.5 g/kg, carbs fill the rest; keto and
 * low-carb cap the carbs) and training/rest-day calorie cycling. Pure functions shared by the server
 * (formula baseline + AI sanity checks) and the wizard (live previews).
 */

/** kcal in 1 kg of body fat, the usual rule of thumb for weekly change estimates. */
const KCAL_PER_KG = 7700;

/** Revised Harris-Benedict (Roza & Shizgal, 1984), kcal/day. */
export function harrisBenedictBmr({ sex, weightKg, heightCm, age }: Pick<PlanInputs, "sex" | "weightKg" | "heightCm" | "age">): number {
  return sex === "male"
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

/** Extra activity per weekly session, by training style (on top of a sedentary 1.2). */
const SESSION_FACTOR: Record<TrainingStyle, number> = { strength: 0.075, functional: 0.085, cardio: 0.09, sedentary: 0 };

export function activityFactor(style: TrainingStyle, trainingDays: number): number {
  return Math.min(1.9, 1.2 + SESSION_FACTOR[style] * (style === "sedentary" ? 0 : trainingDays));
}

/** Signed daily kcal change from maintenance for the goal. */
export function goalAdjustment({ goal, intensity }: Pick<PlanInputs, "goal" | "intensity">): number {
  return goal === "cut" ? -intensity : goal === "bulk" ? intensity : 0;
}

/** Expected body-weight change per week, kg (negative = loss). */
export function weeklyChangeKg(adjustmentKcal: number): number {
  return Math.round(((adjustmentKcal * 7) / KCAL_PER_KG) * 100) / 100;
}

/** Weeks to reach the target weight at this pace, or null if not applicable. */
export function weeksToGoal(inputs: Pick<PlanInputs, "weightKg" | "targetWeightKg" | "goal" | "intensity">): number | null {
  if (inputs.targetWeightKg == null || inputs.goal === "maintain") return null;
  const perWeek = weeklyChangeKg(goalAdjustment(inputs));
  const diff = inputs.targetWeightKg - inputs.weightKg;
  if (perWeek === 0 || Math.sign(diff) !== Math.sign(perWeek)) return null;
  return Math.ceil(diff / perWeek);
}

export const KETO_CARBS = { min: 15, max: 30 } as const;
/** Low-carb days stop carbs here; the remaining energy goes to fat. */
export const LOW_CARB_MAX_G = 100;
const MIN_PLAN_KCAL = { male: 1500, female: 1200 } as const;
/** Above this BMI, protein is based on the weight at this BMI (lean-mass proxy). */
const PROTEIN_REFERENCE_BMI = 27;

/** Body weight protein is calculated from (capped for high BMI). */
export function proteinReferenceWeight({ weightKg, heightCm }: Pick<PlanInputs, "weightKg" | "heightCm">): number {
  return Math.min(weightKg, PROTEIN_REFERENCE_BMI * (heightCm / 100) ** 2);
}

/** Grams of protein and fat for a body (both per kg of the protein reference weight). */
export function baseGrams(inputs: Pick<PlanInputs, "weightKg" | "heightCm" | "fatPerKg">): { protein: number; fat: number } {
  const weight = proteinReferenceWeight(inputs);
  return { protein: weight * PROTEIN_PER_KG, fat: weight * inputs.fatPerKg };
}

/**
 * Macros for a calorie target: protein and fat fixed in grams (4 and 9 kcal/g), carbs (4 kcal/g)
 * fill the rest. Keto keeps carbs at 15–30 g and low-carb at most 100 g; fat absorbs the
 * difference. If protein + fat alone exceed the calories, carbs drop to 0 and fat gives way.
 */
export function macrosFor(kcal: number, grams: { protein: number; fat: number }, style: DietStyle): DayTargets {
  const protein = grams.protein;
  let fat = grams.fat;
  let carbs = (kcal - protein * 4 - fat * 9) / 4;
  if (style === "keto" || (style === "lowCarb" && carbs > LOW_CARB_MAX_G)) {
    carbs = style === "keto" ? Math.min(KETO_CARBS.max, Math.max(KETO_CARBS.min, carbs)) : LOW_CARB_MAX_G;
    fat = (kcal - protein * 4 - carbs * 4) / 9;
  }
  if (carbs < 0) {
    carbs = 0;
    fat = (kcal - protein * 4) / 9;
  }
  return { calories: Math.round(kcal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.max(0, Math.round(fat)) };
}

/** Fraction added to training days; rest days absorb it so the weekly average stays on target. */
const CYCLE_SHIFT = 0.12;
/** Rest days never drop below this share of the average. */
const REST_FLOOR = 0.8;

/** Training/rest-day targets whose weekly average equals `base.calories`. */
export function cycleTargets(base: DayTargets, style: DietStyle, trainingDays: number): { training: DayTargets; rest: DayTargets } | null {
  // Carbs follow training: less fat on training days, more on rest days (same protein).
  const restDays = 7 - trainingDays;
  if (trainingDays === 0 || restDays === 0) return null;
  const shift = Math.min(CYCLE_SHIFT, ((1 - REST_FLOOR) * restDays) / trainingDays);
  const training = base.calories * (1 + shift);
  const rest = (7 * base.calories - trainingDays * training) / restDays;
  return {
    training: macrosFor(training, { protein: base.protein, fat: base.fat * 0.8 }, style),
    rest: macrosFor(rest, { protein: base.protein, fat: base.fat * 1.3 }, style),
  };
}

export interface FormulaResult {
  bmr: number;
  tdee: number;
  base: DayTargets;
  cycle: { training: DayTargets; rest: DayTargets } | null;
}

/** The deterministic plan: Harris-Benedict → activity → goal → macro engine → optional cycling. */
export function formulaPlan(inputs: PlanInputs): FormulaResult {
  const bmr = harrisBenedictBmr(inputs);
  const days = inputs.trainingStyle === "sedentary" ? 0 : inputs.trainingDays.length;
  const tdee = bmr * activityFactor(inputs.trainingStyle, days);
  const kcal = Math.max(MIN_PLAN_KCAL[inputs.sex], tdee + goalAdjustment(inputs));
  const base = macrosFor(kcal, baseGrams(inputs), inputs.dietStyle);
  const cycle = inputs.cycling ? cycleTargets(base, inputs.dietStyle, days) : null;
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), base, cycle };
}

const fmt = (n: number, digits = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: digits });

/** A personalised 2–3 sentence strategy, used when the AI coach is unavailable. */
export function formulaSummary(inputs: PlanInputs, result: FormulaResult): string {
  const adj = goalAdjustment(inputs);
  const perKg = result.base.protein / inputs.weightKg;
  const sentences: string[] = [];

  if (inputs.goal === "cut") {
    sentences.push(
      `Günlük yaklaşık ${fmt(-adj)} kcal açıkla haftada ~${fmt(Math.abs(weeklyChangeKg(adj)), 2)} kg yağ kaybı hedefliyoruz; ${fmt(result.base.protein)} g protein (${fmt(perKg, 1)} g/kg) açıktayken kas kütleni korur.`,
    );
  } else if (inputs.goal === "bulk") {
    sentences.push(
      `Günlük ~${fmt(adj)} kcal fazlayla haftada ~${fmt(weeklyChangeKg(adj), 2)} kg kontrollü kilo artışı hedefliyoruz; ${fmt(result.base.protein)} g protein (${fmt(perKg, 1)} g/kg) kas yapımını destekler.`,
    );
  } else {
    sentences.push(`Kalorini ${fmt(result.base.calories)} kcal civarında tutarak formunu koruyoruz; ${fmt(result.base.protein)} g protein (${fmt(perKg, 1)} g/kg) toparlanmanı destekler.`);
  }

  if (result.cycle) {
    sentences.push(
      `Haftadaki ${inputs.trainingDays.length} antrenman gününde (${TRAINING_STYLE_LABELS[inputs.trainingStyle].toLocaleLowerCase("tr-TR")}) ${fmt(result.cycle.training.calories)} kcal, dinlenme günlerinde ${fmt(result.cycle.rest.calories)} kcal al; ekstra karbonhidratı antrenman günlerine kaydır.`,
    );
  } else if (inputs.dietStyle === "keto") {
    sentences.push("Ketojenik düzende karbonhidratı günde 30 g altında tut; enerjini zeytinyağı, yumurta, avokado ve kuruyemiş gibi kaliteli yağlardan al.");
  } else if (inputs.trainingStyle !== "sedentary") {
    sentences.push(`${DIET_STYLE_LABELS[inputs.dietStyle]} düzeninde karbonhidratının çoğunu antrenman öncesi ve sonrasına yerleştir.`);
  }

  sentences.push(
    inputs.mealPattern === "if168"
      ? `16:8 düzeninde yeme pencereni ${inputs.fastingWindowStart}:00–${inputs.fastingWindowStart + 8}:00 arasında tut ve proteini 2–3 öğüne böl.`
      : "Proteini 3 ana ve 2 ara öğüne dengeli dağıt; her öğünde bir protein kaynağı olsun.",
  );
  return sentences.join(" ");
}

/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

export type DayType = "training" | "rest";

/** The targets that apply on `date` (training or rest day when cycling). */
export function targetsForDate(plan: NutritionPlan, date: Date): { targets: DayTargets; dayType: DayType | null } {
  if (!plan.cycle) return { targets: plan.base, dayType: null };
  const training = plan.inputs.trainingDays.includes(weekdayIndex(date));
  return training ? { targets: plan.cycle.training, dayType: "training" } : { targets: plan.cycle.rest, dayType: "rest" };
}

/**
 * The plan as FitBot's existing context shapes (a Profile + a custom plan with today's targets), so
 * the coach sees the new plan without changing its prompt or tools.
 */
export function planForFitbot(plan: NutritionPlan, date: Date): { profile: Profile; customPlan: CustomPlan } {
  const i = plan.inputs;
  const factor = plan.tdee / plan.bmr;
  const activity = factor < 1.3 ? "sedentary" : factor < 1.45 ? "light" : factor < 1.6 ? "moderate" : factor < 1.8 ? "active" : "veryActive";
  const trainingType = i.trainingStyle === "strength" ? "hypertrophy" : i.trainingStyle === "functional" ? "strength" : i.trainingStyle === "cardio" ? "cardio" : "rest";
  const paceGoal = i.intensity <= 350 ? "slow" : i.intensity <= 600 ? "moderate" : "aggressive";
  const { targets } = targetsForDate(plan, date);
  return {
    profile: {
      id: plan.id,
      label: "AI planı",
      gender: i.sex,
      heightCm: i.heightCm,
      weightKg: i.weightKg,
      age: i.age,
      activity,
      targetWeightKg: i.targetWeightKg,
      paceGoal,
      trainingType,
    },
    customPlan: {
      calories: targets.calories,
      minProtein: Math.max(1, targets.protein),
      carbs: Math.max(1, targets.carbs),
      fat: Math.max(1, targets.fat),
      active: true,
    },
  };
}
