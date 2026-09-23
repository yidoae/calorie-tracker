"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import {
  ACTIVITY_LEVELS,
  PACE_LEVELS,
  PROFILE_LIMITS,
  TRAINING_TYPES,
  inRange,
  isValidProfile,
  type ActivityLevel,
  type Gender,
  type PaceLevel,
  type Profile,
  type TrainingType,
} from "@/lib/profile";
import ProfileResults from "./ProfileResults";

interface Props {
  /** The profile being edited, or null to start a blank "new plan" form. */
  editing: Profile | null;
  onSave: (profile: Profile) => void;
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 tabular-nums outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 aria-[invalid=true]:border-red-500 dark:border-zinc-700";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p_${Date.now()}_${Math.random()}`;
}

/** Blank calculator form; also used to reset after saving so it's ready for the next plan. */
function blankState(editing: Profile | null) {
  return {
    label: editing?.label ?? "",
    gender: editing?.gender ?? ("male" as Gender),
    height: editing ? String(editing.heightCm) : "",
    weight: editing ? String(editing.weightKg) : "",
    age: editing ? String(editing.age) : "",
    activity: editing?.activity ?? ("moderate" as ActivityLevel),
    targetWeight: editing?.targetWeightKg != null ? String(editing.targetWeightKg) : "",
    pace: editing?.paceGoal ?? ("moderate" as PaceLevel),
    training: editing?.trainingType ?? ("rest" as TrainingType),
  };
}

/** Profile calculator: BMI / BMR / TDEE / macro targets adjusted for a weight goal and training load. */
export default function ProfilePanel({ editing, onSave }: Props) {
  const [form, setForm] = useState(() => blankState(editing));
  const [draftId, setDraftId] = useState(() => editing?.id ?? newId());

  const profile: Profile = {
    id: draftId,
    label: form.label.trim() || "My plan",
    gender: form.gender,
    heightCm: Number(form.height),
    weightKg: Number(form.weight),
    age: Number(form.age),
    activity: form.activity,
    targetWeightKg: form.targetWeight.trim() === "" ? null : Number(form.targetWeight),
    paceGoal: form.pace,
    trainingType: form.training,
  };
  const valid = isValidProfile(profile);

  function numberField(
    id: "heightCm" | "weightKg" | "age",
    label: string,
    unit: string,
    value: string,
    setValue: (v: string) => void,
  ) {
    const { min, max } = PROFILE_LIMITS[id];
    const invalid = value !== "" && !inRange(id, Number(value));
    return (
      <div>
        <label htmlFor={`profile-${id}`} className="mb-1 block text-sm font-medium">
          {label} <span className="font-normal text-zinc-500 dark:text-zinc-400">({unit})</span>
        </label>
        <input
          id={`profile-${id}`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `profile-${id}-hint` : undefined}
          className={inputClass}
        />
        {invalid && (
          <p id={`profile-${id}-hint`} className="mt-1 text-xs text-red-600 dark:text-red-400">
            {min}–{max}
          </p>
        )}
      </div>
    );
  }

  const targetWeightInvalid = form.targetWeight !== "" && !inRange("weightKg", Number(form.targetWeight));

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(profile);
          setForm(blankState(null));
          setDraftId(newId());
        }}
      >
        <div>
          <label htmlFor="profile-label" className="mb-1 block text-sm font-medium">
            Plan name <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
          </label>
          <input
            id="profile-label"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Summer cut"
            className={inputClass}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Gender</legend>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map(({ value, label }) => (
              <label
                key={value}
                className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-300 text-sm font-medium transition-colors has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600/30 dark:border-zinc-700 dark:has-[:checked]:bg-emerald-950 dark:has-[:checked]:text-emerald-300"
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={form.gender === value}
                  onChange={() => setForm((f) => ({ ...f, gender: value }))}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          {numberField("heightCm", "Height", "cm", form.height, (v) => setForm((f) => ({ ...f, height: v })))}
          {numberField("weightKg", "Weight", "kg", form.weight, (v) => setForm((f) => ({ ...f, weight: v })))}
          {numberField("age", "Age", "yrs", form.age, (v) => setForm((f) => ({ ...f, age: v })))}
        </div>

        <div>
          <label htmlFor="profile-activity" className="mb-1 block text-sm font-medium">
            Activity level
          </label>
          <select
            id="profile-activity"
            value={form.activity}
            onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))}
            className={`${inputClass} bg-white dark:bg-zinc-900`}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Goal &amp; training</p>

          <div>
            <label htmlFor="profile-target-weight" className="mb-1 block text-sm font-medium">
              Target weight <span className="font-normal text-zinc-500 dark:text-zinc-400">(kg, optional)</span>
            </label>
            <input
              id="profile-target-weight"
              type="number"
              inputMode="decimal"
              step="any"
              value={form.targetWeight}
              onChange={(e) => setForm((f) => ({ ...f, targetWeight: e.target.value }))}
              placeholder="Leave blank to maintain"
              aria-invalid={targetWeightInvalid}
              className={inputClass}
            />
            {targetWeightInvalid && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {PROFILE_LIMITS.weightKg.min}–{PROFILE_LIMITS.weightKg.max}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-pace" className="mb-1 block text-sm font-medium">
              Weekly rate / goal speed
            </label>
            <select
              id="profile-pace"
              value={form.pace}
              onChange={(e) => setForm((f) => ({ ...f, pace: e.target.value as PaceLevel }))}
              className={`${inputClass} bg-white dark:bg-zinc-900`}
            >
              {Object.entries(PACE_LEVELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profile-training" className="mb-1 block text-sm font-medium">
              Training type / frequency
            </label>
            <select
              id="profile-training"
              value={form.training}
              onChange={(e) => setForm((f) => ({ ...f, training: e.target.value as TrainingType }))}
              className={`${inputClass} bg-white dark:bg-zinc-900`}
            >
              {Object.entries(TRAINING_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          <Check className="size-5" /> {editing ? "Update plan" : "Save targets"}
        </button>
      </form>

      {valid ? (
        <ProfileResults profile={profile} />
      ) : (
        <p aria-live="polite" className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Enter your height, weight and age to see your BMI, energy needs and recommended daily targets.
        </p>
      )}
    </div>
  );
}
