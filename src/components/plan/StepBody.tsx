import { Dumbbell, Flame, Scale } from "lucide-react";
import type { usePlanWizard } from "@/hooks/usePlanWizard";
import { GOAL_LABELS } from "@/lib/labels";
import { weeklyChangeKg } from "@/lib/nutrition/plan";
import { INTENSITY_RANGE, PLAN_GOALS, type PlanGoal } from "@/types/plan";
import { PROFILE_LIMITS } from "@/types/profile";
import ChoiceCard from "../ui/ChoiceCard";
import RangeSlider from "../ui/RangeSlider";

type Wizard = ReturnType<typeof usePlanWizard>;

const GOAL_ICONS: Record<PlanGoal, React.ReactNode> = {
  cut: <Flame className="size-5" />,
  maintain: <Scale className="size-5" />,
  bulk: <Dumbbell className="size-5" />,
};

const fmt = (n: number, digits = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: digits });

/** Step 1: body data, goal and how hard to push (deficit/surplus slider with live weekly change). */
export default function StepBody({ w }: { w: Wizard }) {
  const { form } = w;
  const field = (key: "heightCm" | "weightKg" | "age" | "targetWeightKg", label: string, unit: string, limitKey: keyof typeof PROFILE_LIMITS, optional = false) => (
    <div>
      <label htmlFor={`plan-${key}`} className="label truncate">
        {label} <span className="font-normal text-fg-subtle">({unit}{optional ? ", isteğe bağlı" : ""})</span>
      </label>
      <input
        id={`plan-${key}`}
        type="number"
        inputMode="decimal"
        step="any"
        value={form[key]}
        onChange={(e) => w.set(key, e.target.value)}
        aria-invalid={w.errors[key]}
        className="input"
      />
      {w.errors[key] && (
        <p className="error-text">
          {PROFILE_LIMITS[limitKey].min}–{PROFILE_LIMITS[limitKey].max} {unit}
        </p>
      )}
    </div>
  );

  const range = form.goal === "maintain" ? null : INTENSITY_RANGE[form.goal];
  const change = weeklyChangeKg(form.goal === "cut" ? -form.intensity : form.intensity);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">Cinsiyet</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-[6px] border border-border-strong bg-surface p-1">
          {(["male", "female"] as const).map((sex) => (
            <button
              key={sex}
              type="button"
              role="radio"
              aria-checked={form.sex === sex}
              onClick={() => w.set("sex", sex)}
              className={`h-9 cursor-pointer rounded-[4px] text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring ${
                form.sex === sex ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"
              }`}
            >
              {sex === "male" ? "Erkek" : "Kadın"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {field("heightCm", "Boy", "cm", "heightCm")}
        {field("weightKg", "Kilo", "kg", "weightKg")}
        {field("age", "Yaş", "yıl", "age")}
        {field("targetWeightKg", "Hedef kilo", "kg", "weightKg", true)}
      </div>

      <fieldset>
        <legend className="label">Hedefin</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
          {PLAN_GOALS.map((goal) => (
            <ChoiceCard
              key={goal}
              selected={form.goal === goal}
              onSelect={() => w.setGoal(goal)}
              title={GOAL_LABELS[goal].title}
              hint={GOAL_LABELS[goal].hint}
              icon={GOAL_ICONS[goal]}
            />
          ))}
        </div>
        {w.errors.targetDirection && (
          <p role="alert" className="error-text">
            {form.goal === "cut" ? "Yağ yakımı için hedef kilon şu anki kilondan düşük olmalı." : "Kas kazanımı için hedef kilon şu anki kilondan yüksek olmalı."}
          </p>
        )}
      </fieldset>

      {range && (
        <div className="animate-enter rounded-[10px] border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="plan-intensity" className="text-sm font-semibold">
              {form.goal === "cut" ? "Kalori açığı" : "Kalori fazlası"}
            </label>
            <p className="font-display text-2xl tabular-nums">
              {form.goal === "cut" ? "−" : "+"}
              {fmt(form.intensity)} <span className="text-sm text-fg-muted">kcal/gün</span>
            </p>
          </div>
          <div className="mt-3">
            <RangeSlider
              id="plan-intensity"
              label={form.goal === "cut" ? "Kalori açığı" : "Kalori fazlası"}
              value={form.intensity}
              min={range.min}
              max={range.max}
              step={range.step}
              onChange={w.setIntensity}
              valueText={`${form.intensity} kcal, haftada ${fmt(Math.abs(change), 2)} kg`}
              fillColor={form.goal === "cut" ? "var(--macro-protein)" : undefined}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-semibold tracking-[0.05em] text-fg-subtle uppercase">
            <span>{form.goal === "cut" ? "Rahat / sürdürülebilir" : "Temiz / yavaş"}</span>
            <span>Agresif</span>
          </div>
          <p aria-live="polite" className="mt-3 text-[13px]">
            Tahmini haftalık kilo değişimi:{" "}
            <strong className="font-display tabular-nums">
              {change > 0 ? "+" : ""}
              {fmt(change, 2)} kg
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
