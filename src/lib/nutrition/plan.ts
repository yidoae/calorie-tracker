import { DIET_STYLE_LABELS, TRAINING_STYLE_LABELS } from "@/lib/labels";
import type { CustomPlan, Profile } from "@/types/profile";
import type { DayTargets, DietStyle, NutritionPlan, PlanInputs, TrainingStyle } from "@/types/plan";

/*
 * Plan math: Harris-Benedict BMR, activity from the training routine, goal adjustment, macro split
 * per diet style and training/rest-day calorie cycling. Pure functions shared by the server
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

/** Protein per kg of body weight and fat share of calories, by diet style. */
export const DIET_RULES: Record<DietStyle, { proteinPerKg: number; fatShare: number }> = {
  highProtein: { proteinPerKg: 2.2, fatShare: 0.25 },
  lowCarb: { proteinPerKg: 2.0, fatShare: 0.4 },
  keto: { proteinPerKg: 1.7, fatShare: 0.7 },
  iifym: { proteinPerKg: 1.8, fatShare: 0.3 },
};

export const KETO_CARBS = { min: 15, max: 30 } as const;
const MIN_PLAN_KCAL = { male: 1500, female: 1200 } as const;
/** Above this BMI, protein is based on the weight at this BMI (lean-mass proxy). */
const PROTEIN_REFERENCE_BMI = 27;

/** Body weight protein is calculated from (capped for high BMI). */
export function proteinReferenceWeight({ weightKg, heightCm }: Pick<PlanInputs, "weightKg" | "heightCm">): number {
  return Math.min(weightKg, PROTEIN_REFERENCE_BMI * (heightCm / 100) ** 2);
}

/**
 * Macros for a calorie target: protein fixed, fat as a share of calories, carbs fill the rest.
 * `fatScale` shifts energy between fat and carbs (lower on training days, higher on rest days).
 */
export function macrosFor(kcal: number, protein: number, style: DietStyle, fatScale = 1): DayTargets {
  let fat = (kcal * DIET_RULES[style].fatShare * fatScale) / 9;
  let carbs = (kcal - protein * 4 - fat * 9) / 4;
  if (style === "keto") {
    carbs = Math.min(KETO_CARBS.max, Math.max(KETO_CARBS.min, carbs));
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
  const restDays = 7 - trainingDays;
  if (trainingDays === 0 || restDays === 0) return null;
  const shift = Math.min(CYCLE_SHIFT, ((1 - REST_FLOOR) * restDays) / trainingDays);
  const training = base.calories * (1 + shift);
  const rest = (7 * base.calories - trainingDays * training) / restDays;
  return {
    training: macrosFor(training, base.protein, style, 0.8),
    rest: macrosFor(rest, base.protein, style, 1.3),
  };
}

export interface FormulaResult {
  bmr: number;
  tdee: number;
  base: DayTargets;
  cycle: { training: DayTargets; rest: DayTargets } | null;
}

/** The deterministic plan: Harris-Benedict → activity → goal → diet-style macros → optional cycling. */
export function formulaPlan(inputs: PlanInputs): FormulaResult {
  const bmr = harrisBenedictBmr(inputs);
  const days = inputs.trainingStyle === "sedentary" ? 0 : inputs.trainingDays.length;
  const tdee = bmr * activityFactor(inputs.trainingStyle, days);
  const kcal = Math.max(MIN_PLAN_KCAL[inputs.sex], tdee + goalAdjustment(inputs));
  const protein = proteinReferenceWeight(inputs) * DIET_RULES[inputs.dietStyle].proteinPerKg;
  const base = macrosFor(kcal, protein, inputs.dietStyle);
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
