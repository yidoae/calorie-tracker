"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { goalFromWeights, onboardingToPlanInputs } from "@/lib/nutrition/onboarding";
import { formulaPlan, goalAdjustment, weeklyChangeKg, weeksToGoal } from "@/lib/nutrition/plan";
import { ROUTES } from "@/lib/routes";
import { authService } from "@/services/authService";
import { errorMessage } from "@/services/http";
import { onboardingSchema } from "@/types/onboarding";
import { FAT_PER_KG_RANGE, type DietStyle } from "@/types/plan";
import { inRange, type ActivityLevel, type Gender } from "@/types/profile";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

type NumberField = "age" | "heightCm" | "weightKg" | "targetWeightKg";

interface OnboardingForm extends Record<NumberField, string> {
  sex: Gender;
  activity: ActivityLevel;
  dietStyle: DietStyle;
  fatPerKg: number;
}

const toNumber = (v: string) => Number(v.replace(",", "."));

/**
 * The first-time setup: form state, validation, a live preview with the same formula the server
 * uses, and saving (the server rebuilds the plan, then the panel opens).
 */
export function useOnboarding() {
  const { settings, replaceSettings } = useAuth();
  const toast = useToast();
  const router = useRouter();
  // Prefill from a plan or calculator profile carried over from this device, if there is one.
  const [form, setForm] = useState<OnboardingForm>(() => {
    const plan = settings.nutritionPlan?.inputs;
    const legacy = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null;
    const text = (n: number | null | undefined) => (n == null ? "" : String(n));
    return {
      sex: plan?.sex ?? legacy?.gender ?? "male",
      age: text(plan?.age ?? legacy?.age),
      heightCm: text(plan?.heightCm ?? legacy?.heightCm),
      weightKg: text(plan?.weightKg ?? legacy?.weightKg),
      targetWeightKg: text(plan?.targetWeightKg ?? legacy?.targetWeightKg),
      activity: legacy?.activity ?? "moderate",
      dietStyle: plan?.dietStyle ?? "highProtein",
      fatPerKg: plan?.fatPerKg ?? FAT_PER_KG_RANGE.default,
    };
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numbers = {
    age: toNumber(form.age),
    heightCm: toNumber(form.heightCm),
    weightKg: toNumber(form.weightKg),
    targetWeightKg: toNumber(form.targetWeightKg),
  };
  const errors: Record<NumberField, boolean> = {
    age: form.age !== "" && !inRange("age", numbers.age),
    heightCm: form.heightCm !== "" && !inRange("heightCm", numbers.heightCm),
    weightKg: form.weightKg !== "" && !inRange("weightKg", numbers.weightKg),
    targetWeightKg: form.targetWeightKg !== "" && !inRange("weightKg", numbers.targetWeightKg),
  };

  const parsed = onboardingSchema.safeParse({ ...form, ...numbers });
  const input = parsed.success ? parsed.data : null;

  const planInputs = input ? onboardingToPlanInputs(input) : null;
  const preview = planInputs && {
    ...formulaPlan(planInputs),
    adjustment: goalAdjustment(planInputs),
    weeklyChange: weeklyChangeKg(goalAdjustment(planInputs)),
    weeksToGoal: weeksToGoal(planInputs),
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!input || pending) return;
    setPending(true);
    setError(null);
    try {
      replaceSettings(await authService.completeOnboarding(input));
      toast.success("Planın hazır", "Hedeflerin panele işlendi. İstediğin zaman Beslenme planım'dan ince ayar yapabilirsin.");
      // Stays "pending" while the panel loads, so the button can't be pressed twice.
      router.replace(ROUTES.panel);
    } catch (err) {
      setError(errorMessage(err));
      toast.error("Kaydedilemedi", errorMessage(err));
      setPending(false);
    }
  }

  return {
    form,
    errors,
    preview,
    /** "cut" / "maintain" / "bulk", read from current vs goal weight (null until both are valid). */
    goal: !errors.weightKg && !errors.targetWeightKg && form.weightKg && form.targetWeightKg ? goalFromWeights(numbers.weightKg, numbers.targetWeightKg) : null,
    weightKg: inRange("weightKg", numbers.weightKg) ? numbers.weightKg : null,
    set: <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => setForm((f) => ({ ...f, [key]: value })),
    canSubmit: input !== null && !pending,
    pending,
    error,
    submit,
  };
}
