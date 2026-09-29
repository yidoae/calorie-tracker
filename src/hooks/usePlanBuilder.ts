"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formulaPlan, formulaSummary } from "@/lib/nutrition/plan";
import { ApiError } from "@/services/http";
import { planService } from "@/services/planService";
import type { NutritionPlan, PlanInputs } from "@/types/plan";
import { useAuth } from "./useAuth";
import { useNutritionPlan } from "./useNutritionPlan";
import { useToast } from "./useToast";

export const GENERATION_STEPS = ["Metabolizma hesaplanıyor…", "Makro dengeleri kuruluyor…", "Koç stratejisi yazılıyor…"] as const;
const STEP_MS = 1300;
/** Keep the loading screen up long enough to read, even when the fallback answers instantly. */
const MIN_LOADING_MS = STEP_MS * GENERATION_STEPS.length;

const AI_UNAVAILABLE = "AI koç servisine erişilemedi, standart bilimsel formülle plan oluşturuldu.";

export type BuilderPhase =
  | { kind: "wizard" }
  | { kind: "generating"; stepIndex: number }
  | { kind: "review"; plan: NutritionPlan; notice: string | null; isNew: boolean };

/** Same fallback as the server's, for when the server itself can't be reached. */
function localFallback(inputs: PlanInputs): NutritionPlan {
  const result = formulaPlan(inputs);
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    inputs,
    source: "formula",
    bmr: result.bmr,
    tdee: result.tdee,
    base: result.base,
    cycle: result.cycle,
    strategySummary: formulaSummary(inputs, result),
  };
}

/**
 * The /plan flow: wizard -> AI generation (stepped loading screen) -> fine-tuning -> save. A plan
 * is always produced: if the AI or even the server is unavailable, the formula plan is used and
 * the user is told so.
 */
export function usePlanBuilder(startInReview: boolean) {
  const router = useRouter();
  const toast = useToast();
  const { requireAuth } = useAuth();
  const { plan: activePlan, savePlan } = useNutritionPlan();
  // null until the user does something: then "Planı düzenle" (startInReview) shows the saved plan
  // in the tuning desk once the account has loaded, otherwise the wizard.
  const [phase, setPhase] = useState<BuilderPhase | null>(null);
  const effectivePhase: BuilderPhase =
    phase ?? (startInReview && activePlan ? { kind: "review", plan: activePlan, notice: null, isNew: false } : { kind: "wizard" });

  useEffect(() => {
    if (phase?.kind !== "generating") return;
    const timer = setInterval(
      () => setPhase((p) => (p?.kind === "generating" ? { ...p, stepIndex: Math.min(GENERATION_STEPS.length - 1, p.stepIndex + 1) } : p)),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, [phase?.kind]);

  const generate = useCallback(
    (inputs: PlanInputs) =>
      requireAuth(async () => {
        setPhase({ kind: "generating", stepIndex: 0 });
        const minimum = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));
        try {
          const [result] = await Promise.all([planService.generate(inputs), minimum]);
          setPhase({ kind: "review", plan: result.plan, notice: result.notice, isNew: true });
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            // Session expired meanwhile: back to the answers, which are kept, and sign in again.
            setPhase({ kind: "wizard" });
            toast.error("Oturumun sona erdi", "Tekrar giriş yapıp planı yeniden oluştur.");
            return;
          }
          await minimum;
          setPhase({ kind: "review", plan: localFallback(inputs), notice: AI_UNAVAILABLE, isNew: true });
        }
      }),
    [requireAuth, toast],
  );

  const activate = useCallback(
    (plan: NutritionPlan) =>
      requireAuth(() => {
        savePlan(plan);
        toast.celebrate("Planın aktif!", `Günlük hedefin ${plan.base.calories.toLocaleString("tr-TR")} kcal. Ana ekranda takip edebilirsin.`);
        router.push("/");
      }),
    [requireAuth, savePlan, toast, router],
  );

  return {
    phase: effectivePhase,
    hasActivePlan: activePlan !== null,
    generate,
    activate,
    backToWizard: () => setPhase({ kind: "wizard" }),
  };
}
