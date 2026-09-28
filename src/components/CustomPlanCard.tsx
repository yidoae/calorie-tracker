"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { MACRO_PRESETS, isValidCustomPlan, presetMacros, type CustomPlan, type MacroPresetKey } from "@/lib/customPlan";
import CustomPlanBadge from "./CustomPlanBadge";

interface Props {
  customPlan: CustomPlan | null;
  onSave: (plan: CustomPlan) => void;
  onRemove: () => void;
}

/** "Custom plan" — a manually-authored set of daily targets that overrides the calculator. */
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
        <label htmlFor={`custom-${id}`} className="label truncate">
          {label} <span className="font-normal text-fg-subtle">({unit})</span>
        </label>
        <input
          id={`custom-${id}`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
        />
      </div>
    );
  }

  return (
    <div className="card space-y-5 p-4">
      <div>
        <div className="flex min-h-6 items-center justify-between gap-2">
          <h2 className="card-title">Create your own plan</h2>
          {customPlan?.active && <CustomPlanBadge />}
        </div>
        <p className="mt-1 text-[13px] text-fg-subtle">Set your own daily thresholds — activating this overrides the calculated targets.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {numberField("calories", "Target calories", "kcal", calories, setCalories)}
        {numberField("protein", "Minimum protein", "g", minProtein, setMinProtein)}
        {numberField("carbs", "Target carbs", "g", carbs, setCarbs)}
        {numberField("fat", "Target fat", "g", fat, setFat)}
      </div>

      <div>
        <p className="section-title mb-2">Quick macro presets</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(MACRO_PRESETS) as [MacroPresetKey, (typeof MACRO_PRESETS)[MacroPresetKey]][]).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="btn btn-secondary h-7 rounded-md px-2.5 text-xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 min-[420px]:flex-row">
        {customPlan && (
          <button type="button" onClick={onRemove} className="btn btn-secondary btn-lg min-[420px]:flex-1">
            <RotateCcw aria-hidden className="size-4" /> Use calculated
          </button>
        )}
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSave({ ...plan, active: true })}
          className="btn btn-primary btn-lg min-[420px]:flex-1"
        >
          <Check aria-hidden className="size-4" /> {customPlan?.active ? "Update plan" : "Activate plan"}
        </button>
      </div>
    </div>
  );
}
