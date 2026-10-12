// Preview stand-in for apps/mobile/src/services/planService.ts: the plan built for the sample
// profile (30-year-old woman, 165 cm, 70 → 62 kg, strength training 4 days, high protein), with
// calorie cycling on so the plan tab, the tuning desk and the dashboard show training/rest days.
import type * as Plans from "@/services/planService";
import { getMyProfile } from "./profileService";

const wait = () => new Promise((resolve) => setTimeout(resolve, 900));

export async function completeOnboarding(..._args: Parameters<typeof Plans.completeOnboarding>): ReturnType<typeof Plans.completeOnboarding> {
  await wait();
  return getMyProfile("00000000-0000-4000-8000-000000000001");
}

export async function savePlan(plan: Parameters<typeof Plans.savePlan>[0]): ReturnType<typeof Plans.savePlan> {
  await wait();
  return { ...plan, id: "00000000-0000-4000-8000-0000000000ab", createdAt: new Date().toISOString() };
}

export async function getPlans(): ReturnType<typeof Plans.getPlans> {
  const plan = await getActivePlan();
  return plan ? [plan] : [];
}

export async function getActivePlan(): Promise<NonNullable<Awaited<ReturnType<typeof Plans.getActivePlan>>>> {
  return {
    id: "00000000-0000-4000-8000-0000000000aa",
    createdAt: "2026-10-11T08:00:00.000Z",
    inputs: {
      sex: "female",
      heightCm: 165,
      weightKg: 70,
      age: 30,
      targetWeightKg: 62,
      goal: "cut",
      intensity: 500,
      trainingStyle: "strength",
      split: "upperLower",
      trainingDays: [0, 1, 3, 4],
      dietStyle: "highProtein",
      fatPerKg: 1.2,
      mealPattern: "classic",
      fastingWindowStart: 12,
      cycling: true,
    },
    bmr: 1476,
    tdee: 2214,
    base: { calories: 1714, protein: 154, carbs: 86, fat: 84 },
    cycle: {
      training: { calories: 1920, protein: 154, carbs: 175, fat: 67 },
      rest: { calories: 1440, protein: 154, carbs: 0, fat: 92 },
    },
    strategySummary:
      "Günlük yaklaşık 500 kcal açıkla haftada ~0,45 kg yağ kaybı hedefliyoruz; 154 g protein (2,2 g/kg) açıktayken kas kütleni korur. Haftadaki 4 antrenman gününde 1.920 kcal, dinlenme günlerinde 1.440 kcal al.",
  };
}
