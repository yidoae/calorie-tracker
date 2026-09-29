import { Moon, Pencil, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { DIET_STYLE_LABELS, GOAL_LABELS, TRAINING_STYLE_LABELS } from "@/lib/labels";
import type { DayType } from "@/lib/nutrition/plan";
import type { TargetSource } from "@/lib/nutrition/targets";
import type { Macros } from "@/types/nutrition";
import type { NutritionPlan } from "@/types/plan";
import FitBotAvatar from "../ui/FitBotAvatar";

interface Props {
  plan: NutritionPlan | null;
  /** Today's targets and where they come from (plan, legacy plan or defaults). */
  targets: Macros;
  source: TargetSource;
  dayType: DayType | null;
}

const fmt = (n: number) => n.toLocaleString("tr-TR");

/** Dashboard summary of the active nutrition plan, with links into the plan wizard / tuning desk. */
export default function ActivePlanCard({ plan, targets, source, dayType }: Props) {
  if (!plan) {
    return (
      <section aria-labelledby="plan-heading" className="card overflow-hidden">
        <div className="bg-ink p-4 text-on-ink sm:p-6">
          <FitBotAvatar className="size-12" />
          <h2 id="plan-heading" className="mt-4 font-display text-xl">
            AI beslenme planını oluştur
          </h2>
          <p className="mt-1 text-[13px] text-on-ink-muted">
            4 adımda hedefini, antrenmanını ve beslenme tarzını anlat; FitBot sana özel kalori ve makro stratejisi hazırlasın.
          </p>
          <Link href="/plan" className="btn btn-primary btn-lg mt-4 w-full">
            <Sparkles aria-hidden className="size-4" /> Planımı oluştur
          </Link>
        </div>
        <div className="p-4 text-[13px] text-fg-muted">
          {source === "default" ? (
            <>Şu an varsayılan hedefler kullanılıyor ({fmt(targets.calories)} kcal).</>
          ) : (
            <>
              Önceki planın ({source === "custom" ? "özel plan" : "hesaplayıcı"}) kullanılıyor: <strong className="text-fg">{fmt(targets.calories)} kcal</strong>,
              P {targets.protein} g · K {targets.carbs} g · Y {targets.fat} g. Yeni plan oluşturduğunda bunun yerine geçer.
            </>
          )}
        </div>
      </section>
    );
  }

  const i = plan.inputs;
  return (
    <section aria-labelledby="plan-heading" className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="plan-heading" className="card-title">
            Aktif planın
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {GOAL_LABELS[i.goal].title} · {DIET_STYLE_LABELS[i.dietStyle]}
          </p>
        </div>
        <span className={`badge shrink-0 ${plan.source === "ai" ? "bg-cta text-cta-fg" : "bg-surface-3 text-fg"}`}>
          {plan.source === "ai" ? "AI koç" : "Formül"}
        </span>
      </div>

      {dayType && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            dayType === "training" ? "bg-cta text-cta-fg" : "bg-warning-soft text-warning-text"
          }`}
        >
          {dayType === "training" ? <Zap aria-hidden className="size-3.5" /> : <Moon aria-hidden className="size-3.5" />}
          Bugün {dayType === "training" ? "antrenman" : "dinlenme"} günü
        </p>
      )}

      <dl className="mt-3 grid grid-cols-4 gap-1.5">
        {(
          [
            ["Kcal", fmt(targets.calories)],
            ["Protein", `${targets.protein}g`],
            ["Karb.", `${targets.carbs}g`],
            ["Yağ", `${targets.fat}g`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="tile min-w-0 px-2 text-center">
            <dt className="tile-label truncate">{label}</dt>
            <dd className="tile-value truncate">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex gap-3 rounded-[10px] border border-border bg-surface-2 p-3">
        <FitBotAvatar className="size-8" />
        <p className="line-clamp-4 text-[13px] text-fg-muted">{plan.strategySummary}</p>
      </div>

      <p className="mt-3 text-xs text-fg-subtle">
        {TRAINING_STYLE_LABELS[i.trainingStyle]}
        {i.trainingStyle !== "sedentary" && ` · haftada ${i.trainingDays.length} gün`}
        {i.mealPattern === "if168" && ` · 16:8 (${i.fastingWindowStart}:00–${i.fastingWindowStart + 8}:00)`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/plan?duzenle=1" className="btn btn-secondary">
          <Pencil aria-hidden className="size-4" /> İnce ayar
        </Link>
        <Link href="/plan" className="btn btn-soft">
          <Sparkles aria-hidden className="size-4" /> Yeni plan
        </Link>
      </div>
    </section>
  );
}
