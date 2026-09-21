"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import {
  ACTIVITY_LEVELS,
  PROFILE_LIMITS,
  inRange,
  isValidProfile,
  type ActivityLevel,
  type Gender,
  type Profile,
} from "@/lib/profile";
import ProfileResults from "./ProfileResults";

interface Props {
  /** The saved profile, if any. Remount (via `key`) to reset the form when it changes. */
  initial: Profile | null;
  onSave: (profile: Profile) => void;
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 tabular-nums outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 aria-[invalid=true]:border-red-500 dark:border-zinc-700";

function sameProfile(a: Profile, b: Profile) {
  return (
    a.gender === b.gender &&
    a.heightCm === b.heightCm &&
    a.weightKg === b.weightKg &&
    a.age === b.age &&
    a.activity === b.activity
  );
}

/** Profile form with live BMI / BMR / TDEE / macro calculations; saving updates the dashboard's targets. */
export default function ProfilePanel({ initial, onSave }: Props) {
  const [gender, setGender] = useState<Gender>(initial?.gender ?? "male");
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : "");
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : "");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [activity, setActivity] = useState<ActivityLevel>(initial?.activity ?? "moderate");

  const profile: Profile = {
    gender,
    heightCm: Number(height),
    weightKg: Number(weight),
    age: Number(age),
    activity,
  };
  const valid = isValidProfile(profile);
  const saved = valid && initial !== null && sameProfile(profile, initial);

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

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !saved) onSave(profile);
        }}
      >
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
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          {numberField("heightCm", "Height", "cm", height, setHeight)}
          {numberField("weightKg", "Weight", "kg", weight, setWeight)}
          {numberField("age", "Age", "yrs", age, setAge)}
        </div>

        <div>
          <label htmlFor="profile-activity" className="mb-1 block text-sm font-medium">
            Activity level
          </label>
          <select
            id="profile-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className={`${inputClass} bg-white dark:bg-zinc-900`}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!valid || saved}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {saved ? (
            <>
              <Check className="size-5" /> Targets saved
            </>
          ) : (
            "Save targets"
          )}
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
