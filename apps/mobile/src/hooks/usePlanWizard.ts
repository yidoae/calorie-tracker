import { buildPlan } from "@calorie/core/nutrition/plan";
import type { DietStyle, MealPattern, PlanGoal, PlanInputs, StrengthSplit, TrainingStyle } from "@calorie/core/schemas/plan";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toAppError } from "@/services/errors";
import { acknowledgeSensitiveWarning, type Profile } from "@/services/profileService";
import {
  canGoTo,
  checkWizard,
  deficitNotice,
  fastingNotice,
  gentlerIntensity,
  initialWizardForm,
  toggleTrainingDay,
  WIZARD_STEPS,
  withFrequency,
  withGoal,
  withTrainingStyle,
  wizardPreview,
  type SensitiveWarning,
  type WizardForm,
} from "./planWizardLogic";
import { setPlanDraft } from "./usePlanDraft";
import { useToast } from "./useToast";

/**
 * The 4-step plan wizard (US4, FR-009, FR-010), ported from the web app: form state, per-step
 * checks, navigation and a live preview from the core engine. 16:8 or a deficit of 750 kcal or
 * more first opens the sensitive-content notice, unless the profile says it was already read
 * (`sensitive_warning_ack`); reading it is saved there. `generate` hands the plan to the review step.
 */
export function usePlanWizard(previous: PlanInputs | null, profile: Profile, initialStep = 0) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<WizardForm>(() => initialWizardForm(previous, profile, new Date().getFullYear()));
  const [step, setStep] = useState(initialStep);
  const [warning, setWarning] = useState<SensitiveWarning | null>(null);
  // Remembered here too, so a failed save does not ask again during this visit.
  const [ackedHere, setAckedHere] = useState(false);
  // Field errors show once the user tries to move on, or as soon as the field has text.
  const [showErrors, setShowErrors] = useState(false);
  const acknowledged = profile.sensitiveWarningAck || ackedHere;

  const { errors, stepValid, inputs } = checkWizard(form);
  const preview = inputs ? wizardPreview(inputs) : null;

  function set<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function acknowledge() {
    setAckedHere(true);
    acknowledgeSensitiveWarning(profile.id)
      .then((saved) => queryClient.setQueryData(["profile", profile.id], saved))
      .catch((err) => toast.show("error", "Tercihin kaydedilemedi", toAppError(err).message));
  }

  return {
    form,
    step,
    errors,
    showErrors,
    stepValid,
    inputs,
    preview,
    isLast: step === WIZARD_STEPS.length - 1,
    set,
    setGoal: (goal: PlanGoal) => setForm((f) => withGoal(f, goal)),
    setTrainingStyle: (style: TrainingStyle) => setForm((f) => withTrainingStyle(f, style)),
    setSplit: (split: StrengthSplit) => set("split", split),
    setFrequency: (count: number) => setForm((f) => withFrequency(f, count)),
    toggleDay: (day: number) => setForm((f) => toggleTrainingDay(f, day)),
    setDietStyle: (style: DietStyle) => set("dietStyle", style),
    setMealPattern: (pattern: MealPattern) => {
      const notice = fastingNotice(form, pattern, acknowledged);
      if (notice) setWarning(notice);
      else set("mealPattern", pattern);
    },
    setIntensity: (value: number) => {
      const notice = deficitNotice(form, value, acknowledged);
      if (notice) setWarning(notice);
      else set("intensity", value);
    },
    /** The notice before 16:8 or a large deficit, while it waits for an answer. */
    warning,
    /** "Anladım, devam et": apply the choice and do not ask again. */
    acceptWarning: () => {
      if (!warning) return;
      if (warning.kind === "fasting") set("mealPattern", "if168");
      else set("intensity", warning.value);
      setWarning(null);
      acknowledge();
    },
    /** "Bana göre değil": keep the gentler option. */
    declineWarning: () => {
      if (warning?.kind === "deficit") set("intensity", gentlerIntensity(form));
      setWarning(null);
    },
    next: () => {
      if (!stepValid[step]) {
        setShowErrors(true);
        return;
      }
      setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
    },
    back: () => setStep((s) => Math.max(0, s - 1)),
    goTo: (target: number) => {
      if (canGoTo(step, target, stepValid)) setStep(target);
    },
    canGoTo: (target: number) => canGoTo(step, target, stepValid),
    /** Builds the plan from the answers for the review step; false while an answer is missing. */
    generate: (): boolean => {
      if (!inputs) {
        setShowErrors(true);
        return false;
      }
      // `id` and `createdAt` are placeholders: the payload drops them and the database assigns both.
      setPlanDraft(buildPlan(inputs, { id: "draft", createdAt: new Date().toISOString() }));
      return true;
    },
  };
}
export type PlanWizard = ReturnType<typeof usePlanWizard>;
