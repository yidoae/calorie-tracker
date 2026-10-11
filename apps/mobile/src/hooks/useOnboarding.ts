import { goalFromWeights, onboardingToPlanInputs } from "@calorie/core/nutrition/onboarding";
import { buildPlan } from "@calorie/core/nutrition/plan";
import { GOAL_LABELS } from "@calorie/core/labels";
import type { DietStyle } from "@calorie/core/schemas/plan";
import type { ActivityLevel, Gender } from "@calorie/core/schemas/profile";
import { planPayloadSchema } from "@calorie/core/schemas/rpc";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toAppError, type AppError } from "@/services/errors";
import { completeOnboarding } from "@/services/planService";
import { saveSetupAnswers, type Profile, type SetupAnswers } from "@/services/profileService";
import { deviceTimeZone } from "./deviceTimeZone";
import {
  ageFromBirthYear,
  answersFromProfile,
  formatNumber,
  numberFieldError,
  parseNumber,
  type NumberField,
  type SetupStep,
} from "./setupSteps";
import { useProfile } from "./useSession";

/** What the user has typed or picked on the current step; numbers stay text until they are saved. */
interface SetupDraft {
  sex: Gender | null;
  age: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activity: ActivityLevel | null;
  dietStyle: DietStyle | null;
}
type DraftField = keyof SetupDraft;

const STEP_FIELDS: Record<SetupStep, DraftField[]> = {
  basics: ["sex", "age"],
  body: ["heightCm", "weightKg"],
  goal: ["targetWeightKg"],
  activity: ["activity"],
  diet: ["dietStyle"],
  summary: [],
};

const CHOICE_ERRORS = { sex: "Cinsiyetini seç.", activity: "Hareket düzeyini seç.", dietStyle: "Beslenme tarzını seç." } as const;

const NUMBER_FIELDS: NumberField[] = ["age", "heightCm", "weightKg", "targetWeightKg"];
const isNumberField = (field: DraftField): field is NumberField => (NUMBER_FIELDS as string[]).includes(field);

function draftFromProfile(p: Profile | null, year: number): SetupDraft {
  const age = ageFromBirthYear(p?.birthYear ?? null, year);
  return {
    sex: p?.sex ?? null,
    age: age === null ? "" : String(age),
    heightCm: formatNumber(p?.heightCm ?? null),
    weightKg: formatNumber(p?.weightKg ?? null),
    targetWeightKg: formatNumber(p?.goalWeightKg ?? null),
    activity: p?.activityLevel ?? null,
    dietStyle: p?.dietStyle ?? null,
  };
}

/**
 * One step of the first-time setup (US2, T035). Each step's answers are saved to the profile
 * before the next step opens, so a killed app resumes at the first unanswered step (FR-006). The
 * summary builds the plan with the core engine and completeOnboarding stores both; the profile
 * query is then refetched, and the root layout moves on to the tabs.
 */
export function useOnboarding(step: SetupStep) {
  const profile = useProfile();
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();
  const [draft, setDraft] = useState(() => draftFromProfile(profile, year));
  const [errors, setErrors] = useState<Partial<Record<DraftField, string>>>({});
  const [formError, setFormError] = useState<AppError | null>(null);
  const [pending, setPending] = useState(false);

  function setField<K extends DraftField>(field: K, value: SetupDraft[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
  }

  /** The step's answers, or null after showing why they cannot be saved. */
  function validStepAnswers(): SetupAnswers | null {
    const next: Partial<Record<DraftField, string>> = {};
    for (const field of STEP_FIELDS[step]) {
      if (isNumberField(field)) next[field] = numberFieldError(field, draft[field]) ?? undefined;
      else if (draft[field] === null) next[field] = CHOICE_ERRORS[field];
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return null;

    const answers: SetupAnswers = {};
    for (const field of STEP_FIELDS[step]) {
      if (isNumberField(field)) answers[field] = parseNumber(draft[field]) ?? undefined;
      else if (field === "sex") answers.sex = draft.sex ?? undefined;
      else if (field === "activity") answers.activity = draft.activity ?? undefined;
      else if (field === "dietStyle") answers.dietStyle = draft.dietStyle ?? undefined;
    }
    return answers;
  }

  /** Saves this step's answers; true when the next step may open. */
  async function saveStep(): Promise<boolean> {
    if (pending || !profile) return false;
    const answers = validStepAnswers();
    if (!answers) return false;
    setPending(true);
    setFormError(null);
    try {
      const saved = await saveSetupAnswers(profile.id, answers);
      queryClient.setQueryData(["profile", profile.id], saved);
      return true;
    } catch (err) {
      setFormError(toAppError(err));
      return false;
    } finally {
      setPending(false);
    }
  }

  // The summary: every answer is saved by now, so the plan is built from the profile.
  const answers = step === "summary" && profile ? answersFromProfile(profile, year, deviceTimeZone()) : null;
  // `id` and `createdAt` are placeholders: the payload drops them and the database assigns both.
  const plan = answers ? buildPlan(onboardingToPlanInputs(answers), { id: "draft", createdAt: new Date().toISOString() }) : null;

  async function finish(): Promise<void> {
    if (pending || !answers || !plan) return;
    setPending(true);
    setFormError(null);
    try {
      await completeOnboarding(answers, planPayloadSchema.parse(plan));
    } catch (err) {
      const error = toAppError(err);
      // Already finished (e.g. the first answer was lost on the way back): just reload the profile.
      if (error.code !== "already_completed") {
        setFormError(error);
        setPending(false);
        return;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["activePlan"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  // The goal the plan will follow, shown while the goal weight is typed.
  const weight = profile?.weightKg ?? null;
  const target = parseNumber(draft.targetWeightKg);
  const goal = weight !== null && target !== null && numberFieldError("targetWeightKg", draft.targetWeightKg) === null ? GOAL_LABELS[goalFromWeights(weight, target)] : null;

  return { draft, errors, formError, pending, setField, saveStep, answers, plan, finish, goal };
}
