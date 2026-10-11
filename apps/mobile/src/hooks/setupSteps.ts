import type { OnboardingInput } from "@calorie/core/schemas/onboarding";
import { inRange, PROFILE_LIMITS } from "@calorie/core/schemas/profile";
import type { Profile } from "@calorie/core/schemas/rows";

/*
 * The first-time setup's steps (contracts/screens.md) and its field rules. Every answer is saved to
 * the profile as soon as its step is done, so the profile alone says where the setup resumes
 * (FR-006). Pure, so tests/setupSteps.test.ts runs it under node.
 */

export const SETUP_STEPS = ["basics", "body", "goal", "activity", "diet", "summary"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export function isSetupStep(value: unknown): value is SetupStep {
  return typeof value === "string" && (SETUP_STEPS as readonly string[]).includes(value);
}

export function stepAfter(step: SetupStep): SetupStep | null {
  return SETUP_STEPS[SETUP_STEPS.indexOf(step) + 1] ?? null;
}

export function stepBefore(step: SetupStep): SetupStep | null {
  return SETUP_STEPS[SETUP_STEPS.indexOf(step) - 1] ?? null;
}

/** Whole years: the profile keeps a birth year, which complete_onboarding sets to the current year − age. */
export function ageFromBirthYear(birthYear: number | null, year: number): number | null {
  return birthYear === null ? null : year - birthYear;
}

const valid = (field: keyof typeof PROFILE_LIMITS, value: number | null) => value !== null && inRange(field, value);

/** A step counts as answered only when its stored values are still accepted today. */
const ANSWERED: Record<Exclude<SetupStep, "summary">, (p: Profile, year: number) => boolean> = {
  basics: (p, year) => p.sex !== null && valid("age", ageFromBirthYear(p.birthYear, year)),
  body: (p) => valid("heightCm", p.heightCm) && valid("weightKg", p.weightKg),
  goal: (p) => valid("weightKg", p.goalWeightKg),
  activity: (p) => p.activityLevel !== null,
  diet: (p) => p.dietStyle !== null,
};

/** Where the setup continues: the first step whose answer is missing, else the summary. */
export function firstUnansweredStep(profile: Profile, year: number): SetupStep {
  return SETUP_STEPS.find((step) => step === "summary" || !ANSWERED[step](profile, year)) ?? "summary";
}

/** The answers for complete_onboarding once every step is answered; null before that. */
export function answersFromProfile(profile: Profile, year: number, timeZone: string): OnboardingInput | null {
  if (firstUnansweredStep(profile, year) !== "summary") return null;
  const { sex, heightCm, weightKg, goalWeightKg, activityLevel, dietStyle } = profile;
  const age = ageFromBirthYear(profile.birthYear, year);
  if (!sex || age === null || heightCm === null || weightKg === null || goalWeightKg === null || !activityLevel || !dietStyle) return null;
  return { sex, age, heightCm, weightKg, targetWeightKg: goalWeightKg, activity: activityLevel, dietStyle, fatPerKg: profile.fatPerKg, timeZone };
}

const NUMBER = /^\d+([.,]\d+)?$/;

/** A number typed by the user; "72,5" and "72.5" both read as 72.5. Null when empty or not a number. */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  return NUMBER.test(trimmed) ? Number(trimmed.replace(",", ".")) : null;
}

/** A stored number as the user types it (decimal comma); empty when unanswered. */
export function formatNumber(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

export type NumberField = "age" | "heightCm" | "weightKg" | "targetWeightKg";

const range = (field: keyof typeof PROFILE_LIMITS) => `${PROFILE_LIMITS[field].min}–${PROFILE_LIMITS[field].max}`;

const NUMBER_FIELDS: Record<NumberField, { limit: keyof typeof PROFILE_LIMITS; whole?: boolean; empty: string; outOfRange: string }> = {
  age: { limit: "age", whole: true, empty: "Yaşını yaz.", outOfRange: `Yaş ${range("age")} arasında bir tam sayı olmalı.` },
  heightCm: { limit: "heightCm", empty: "Boyunu yaz.", outOfRange: `Boy ${range("heightCm")} cm arasında olmalı.` },
  weightKg: { limit: "weightKg", empty: "Kilonu yaz.", outOfRange: `Kilo ${range("weightKg")} kg arasında olmalı.` },
  targetWeightKg: { limit: "weightKg", empty: "Hedef kilonu yaz.", outOfRange: `Hedef kilo ${range("weightKg")} kg arasında olmalı.` },
};

/** Why a number field cannot be saved (FR-007, US2 scenario 3), or null when it can. */
export function numberFieldError(field: NumberField, text: string): string | null {
  const rule = NUMBER_FIELDS[field];
  if (!text.trim()) return rule.empty;
  const value = parseNumber(text);
  if (value === null || !inRange(rule.limit, value) || (rule.whole && !Number.isInteger(value))) return rule.outOfRange;
  return null;
}
