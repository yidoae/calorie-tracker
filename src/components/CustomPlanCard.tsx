"use client";

import { Check, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { MACRO_PRESETS, isValidCustomPlan, presetMacros, type CustomPlan, type MacroPresetKey } from "@/lib/customPlan";

interface Props {
  customPlan: CustomPlan | null;
  onSave: (plan: CustomPlan) => void;
  onRemove: () => void;
}

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 tabular-nums outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30 dark:border-zinc-700";

/** "Kendi Planımı Oluştur" — a manually-authored set of daily targets that overrides the calculator. */
export default function CustomPlanCard({ customPlan, onSave, onRemove }: Props) {
  const [calories, setCalories] = useState(customPlan ? String(customPlan.calories) : "2000");
  const [minProtein, setMinProtein] = useState(customPlan ? String(customPlan.minProtein) : "150");
  const [carbs, setCarbs] = useState(customPlan ? String(customPlan.carbs) : "200");
  const [fat, setFat] = useState(customPlan ? String(customPlan.fat) : "65");

  const plan = {
    calories: Number(calories),
    minProtein: Number(minProtein),
    carbs: Number(carbs),
    fat: Number(fat),
  };
  const valid = isValidCustomPlan(plan);

  function applyPreset(key: MacroPresetKey) {
    const cals = Number(calories) || 2000;
    const macros = presetMacros(cals, key);
    setMinProtein(String(macros.protein));
    setCarbs(String(macros.carbs));
    setFat(String(macros.fat));
  }

  function numberField(id: string, label: string, unit: string, value: string, setValue: (v: string) => void) {
    return (
      <div>
        <label htmlFor={`custom-${id}`} className="mb-1 block text-sm font-medium">
          {label} <span className="font-normal text-zinc-500 dark:text-zinc-400">({unit})</span>
        </label>
        <input
          id={`custom-${id}`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
          Kendi Planımı Oluştur
        </h2>
        {customPlan?.active && (
          <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" /> Özel Plan Aktif
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Set your own daily thresholds — activating this overrides the calculated targets.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {numberField("calories", "Target calories", "kcal", calories, setCalories)}
        {numberField("protein", "Minimum protein", "g", minProtein, setMinProtein)}
        {numberField("carbs", "Target carbs", "g", carbs, setCarbs)}
        {numberField("fat", "Target fat", "g", fat, setFat)}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Quick macro presets</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(MACRO_PRESETS) as [MacroPresetKey, (typeof MACRO_PRESETS)[MacroPresetKey]][]).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="rounded-full border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-800 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {customPlan && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="size-4" /> Use calculated targets
          </button>
        )}
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSave({ ...plan, active: true })}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
        >
          <Check className="size-4" /> {customPlan?.active ? "Update custom plan" : "Activate custom plan"}
        </button>
      </div>
    </div>
  );
}
