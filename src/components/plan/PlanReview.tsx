"use client";

import { ArrowLeft, Check, Moon, RotateCcw, TriangleAlert, Zap } from "lucide-react";
import { usePlanTuner, type TunerDay } from "@/hooks/usePlanTuner";
import { BMI_LABELS } from "@/lib/labels";
import { bmiCategory, calculateBmi } from "@/lib/nutrition/energy";
import { KCAL_PER_GRAM } from "@/lib/nutrition/macros";
import { goalAdjustment, weeklyChangeKg } from "@/lib/nutrition/plan";
import { MACRO_FIELDS, macroRange, type MacroField } from "@/lib/nutrition/planTuning";
import type { NutritionPlan } from "@/types/plan";
import FitBotAvatar from "../ui/FitBotAvatar";
import RangeSlider from "../ui/RangeSlider";
import Segmented, { type SegmentedItem } from "../ui/Segmented";
import Switch from "../ui/Switch";
import MacroSliderRow from "./MacroSliderRow";

interface Props {
  plan: NutritionPlan;
  notice: string | null;
  isNew: boolean;
  onActivate: (plan: NutritionPlan) => void;
  onBackToWizard: () => void;
}

const MACRO_UI: Record<MacroField, { label: string; color: string; dot: string }> = {
  protein: { label: "Protein", color: "var(--macro-protein)", dot: "bg-macro-protein" },
  carbs: { label: "Karbonhidrat", color: "var(--macro-carbs)", dot: "bg-macro-carbs" },
  fat: { label: "Yağ", color: "var(--macro-fat)", dot: "bg-macro-fat" },
};

const fmt = (n: number, digits = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: digits });

/** The "fine-tuning desk": FitBot's strategy, then live sliders for calories and each macro. */
export default function PlanReview({ plan, notice, isNew, onActivate, onBackToWizard }: Props) {
  const t = usePlanTuner(plan);
  const bmi = calculateBmi(plan.inputs);
  const change = weeklyChangeKg(goalAdjustment(plan.inputs));
  const trainingDays = plan.inputs.trainingDays.length;

  const dayTabs: SegmentedItem<TunerDay>[] = [
    { id: "training", label: `Antrenman · ${trainingDays} gün`, icon: <Zap aria-hidden className="size-4" /> },
    { id: "rest", label: `Dinlenme · ${7 - trainingDays} gün`, icon: <Moon aria-hidden className="size-4" /> },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0 space-y-6">
        {notice && (
          <p role="alert" className="alert alert-warning animate-enter">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {notice}
          </p>
        )}

        <section aria-labelledby="coach-heading" className="card animate-enter overflow-hidden">
          <div className="flex items-center gap-3 bg-ink px-4 py-3 text-on-ink sm:px-6">
            <FitBotAvatar className="size-10" />
            <div className="min-w-0 flex-1">
              <h2 id="coach-heading" className="font-display text-base">
                FitBot koç özeti
              </h2>
              <p className="text-xs text-on-ink-muted">{plan.source === "ai" ? "Yerel yapay zekâ ile kişiselleştirildi" : "Harris-Benedict formülüyle hesaplandı"}</p>
            </div>
            <span className={`badge ${plan.source === "ai" ? "bg-cta text-cta-fg" : "bg-ink-2 text-on-ink"}`}>{plan.source === "ai" ? "AI" : "Formül"}</span>
          </div>
          <p className="p-4 text-[15px] leading-relaxed sm:p-6">{plan.strategySummary}</p>
        </section>

        <section aria-labelledby="tuning-heading" className="card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tuning-heading" className="card-title">
              İnce ayar masası
            </h2>
            {t.dirty && (
              <button type="button" onClick={t.reset} className="btn btn-ghost h-8 px-3 text-xs">
                <RotateCcw aria-hidden className="size-3.5" /> Önerilene dön
              </button>
            )}
          </div>

          {t.cycling && (
            <div className="mt-4">
              <Segmented items={dayTabs} value={t.activeDay} onChange={t.setActiveDay} label="Gün tipi" idPrefix="tuner" />
            </div>
          )}

          <div
            key={t.activeDay}
            id={`tuner-${t.activeDay}`}
            role={t.cycling ? "tabpanel" : undefined}
            aria-labelledby={t.cycling ? `tuner-tab-${t.activeDay}` : undefined}
            className="mt-6 animate-enter space-y-6"
          >
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="tune-calories" className="text-sm font-semibold">
                  Günlük kalori{t.cycling ? (t.activeDay === "training" ? " · antrenman günü" : " · dinlenme günü") : ""}
                </label>
                <p className="font-display text-4xl tabular-nums">
                  {fmt(t.current.calories)} <span className="text-base text-fg-muted">kcal</span>
                </p>
              </div>
              <div className="mt-2">
                <RangeSlider
                  id="tune-calories"
                  label="Günlük kalori"
                  value={t.current.calories}
                  {...macroRange("calories", plan.inputs.weightKg)}
                  onChange={t.setCalories}
                  valueText={`${t.current.calories} kcal`}
                  fillColor="var(--ink)"
                />
              </div>
            </div>

            <div className="rounded-[10px] border border-border bg-surface-2 p-3">
              <Switch
                id="tune-lock"
                checked={t.lockCalories}
                onChange={t.setLockCalories}
                label={t.lockCalories ? "Kalori sabit" : "Kalori serbest"}
                description={
                  t.lockCalories
                    ? "Bir makroyu değiştirdiğinde diğer ikisi orantılı dengelenir, toplam kalori değişmez."
                    : "Makroları değiştirdikçe toplam kalori otomatik güncellenir."
                }
              />
            </div>

            <div className="space-y-5">
              {MACRO_FIELDS.map((field) => (
                <MacroSliderRow
                  key={field}
                  id={`tune-${field}`}
                  label={MACRO_UI[field].label}
                  grams={t.current[field]}
                  range={macroRange(field, plan.inputs.weightKg)}
                  percentOfCalories={t.current.calories > 0 ? ((t.current[field] * KCAL_PER_GRAM[field]) / t.current.calories) * 100 : 0}
                  perKg={field === "carbs" ? undefined : t.perKg(t.current[field])}
                  color={MACRO_UI[field].color}
                  dotClass={MACRO_UI[field].dot}
                  onChange={(g) => t.setMacro(field, g)}
                />
              ))}
            </div>

            {/* Energy split bar */}
            <div aria-hidden className="flex h-3 overflow-hidden rounded-full bg-surface-3">
              {MACRO_FIELDS.map((field) => (
                <span
                  key={field}
                  className={`${MACRO_UI[field].dot} transition-[width] duration-300`}
                  style={{ width: `${t.macroEnergy > 0 ? ((t.current[field] * KCAL_PER_GRAM[field]) / t.macroEnergy) * 100 : 0}%` }}
                />
              ))}
            </div>
          </div>

          {t.cycling && (
            <p className="mt-6 rounded-[6px] bg-surface-2 px-3 py-2 text-xs text-fg-muted tabular-nums">
              Haftalık ortalama: <strong className="text-fg">{fmt(t.weeklyAverage.calories)} kcal</strong> · P {t.weeklyAverage.protein} g · K{" "}
              {t.weeklyAverage.carbs} g · Y {t.weeklyAverage.fat} g
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <section aria-label="Metabolizma" className="card p-4">
          <h2 className="section-title">Metabolizma</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div className="tile">
              <dt className="tile-label">BMR</dt>
              <dd className="tile-value">{fmt(plan.bmr)} kcal</dd>
            </div>
            <div className="tile">
              <dt className="tile-label">TDEE</dt>
              <dd className="tile-value">{fmt(plan.tdee)} kcal</dd>
            </div>
            <div className="tile">
              <dt className="tile-label">BMI</dt>
              <dd className="tile-value">
                {fmt(bmi, 1)} <span className="font-sans text-xs font-normal text-fg-muted">{BMI_LABELS[bmiCategory(bmi).tone]}</span>
              </dd>
            </div>
            <div className="tile">
              <dt className="tile-label">Haftalık</dt>
              <dd className="tile-value">{change === 0 ? "Denge" : `${change > 0 ? "+" : ""}${fmt(change, 2)} kg`}</dd>
            </div>
          </dl>
        </section>

        <div className="card space-y-2 p-4">
          <button type="button" onClick={() => onActivate(t.result())} className="btn btn-primary btn-lg w-full">
            <Check aria-hidden className="size-4" /> {isNew ? "Bu planı aktif planım yap" : "Değişiklikleri kaydet"}
          </button>
          <button type="button" onClick={onBackToWizard} className="btn btn-ghost w-full">
            <ArrowLeft aria-hidden className="size-4" /> {isNew ? "Cevaplarımı düzenle" : "Sihirbazla yeni plan oluştur"}
          </button>
        </div>
      </aside>
    </div>
  );
}
