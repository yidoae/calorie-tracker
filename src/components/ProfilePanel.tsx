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

const inputClass = "input";
const unitClass = "font-normal text-fg-subtle";

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
        <label htmlFor={`profile-${id}`} className="label truncate">
          {label} <span className={unitClass}>({unit})</span>
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
          <p id={`profile-${id}-hint`} className="error-text">
            {min}–{max} {unit}
          </p>
        )}
      </div>
    );
  }

  const targetWeightInvalid = form.targetWeight !== "" && !inRange("weightKg", Number(form.targetWeight));

  return (
    <div className="card space-y-5 p-4">
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
          <label htmlFor="profile-label" className="label">
            Plan name <span className={unitClass}>(optional)</span>
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
          <legend className="label">Gender</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1">
            {GENDERS.map(({ value, label }) => (
              <label
                key={value}
                className="flex h-8 cursor-pointer items-center justify-center rounded-md text-[13px] font-medium text-fg-muted transition-[background-color,color,box-shadow] duration-150 hover:text-fg has-[:checked]:bg-surface has-[:checked]:text-fg has-[:checked]:shadow-xs has-[:checked]:ring-1 has-[:checked]:ring-border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
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

        <div className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3">
          {numberField("heightCm", "Height", "cm", form.height, (v) => setForm((f) => ({ ...f, height: v })))}
          {numberField("weightKg", "Weight", "kg", form.weight, (v) => setForm((f) => ({ ...f, weight: v })))}
          {numberField("age", "Age", "yrs", form.age, (v) => setForm((f) => ({ ...f, age: v })))}
        </div>

        <div>
          <label htmlFor="profile-activity" className="label">
            Activity level
          </label>
          <select
            id="profile-activity"
            value={form.activity}
            onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))}
            className={`${inputClass} cursor-pointer`}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div role="group" aria-labelledby="profile-goal-heading" className="space-y-4 border-t border-border pt-4">
          <p id="profile-goal-heading" className="section-title">
            Goal &amp; training
          </p>

          <div>
            <label htmlFor="profile-target-weight" className="label">
              Target weight <span className={unitClass}>(kg, optional)</span>
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
              aria-describedby={targetWeightInvalid ? "profile-target-weight-hint" : undefined}
              className={inputClass}
            />
            {targetWeightInvalid && (
              <p id="profile-target-weight-hint" className="error-text">
                {PROFILE_LIMITS.weightKg.min}–{PROFILE_LIMITS.weightKg.max} kg
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-pace" className="label">
              Weekly rate / goal speed
            </label>
            <select
              id="profile-pace"
              value={form.pace}
              onChange={(e) => setForm((f) => ({ ...f, pace: e.target.value as PaceLevel }))}
              className={`${inputClass} cursor-pointer`}
            >
              {Object.entries(PACE_LEVELS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profile-training" className="label">
              Training type / frequency
            </label>
            <select
              id="profile-training"
              value={form.training}
              onChange={(e) => setForm((f) => ({ ...f, training: e.target.value as TrainingType }))}
              className={`${inputClass} cursor-pointer`}
            >
              {Object.entries(TRAINING_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={!valid} className="btn btn-primary btn-lg w-full">
          <Check aria-hidden className="size-4" /> {editing ? "Update plan" : "Save plan"}
        </button>
      </form>

      {valid ? (
        <ProfileResults profile={profile} />
      ) : (
        <p aria-live="polite" className="rounded-lg border border-dashed border-border-strong p-3 text-[13px] text-fg-subtle">
          Enter your height, weight and age to see your BMI, energy needs and recommended daily targets.
        </p>
      )}
    </div>
  );
}
