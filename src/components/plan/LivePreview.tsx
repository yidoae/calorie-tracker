import { Activity } from "lucide-react";
import type { FormulaResult } from "@/lib/nutrition/plan";

interface Props {
  preview: (FormulaResult & { adjustment: number; weeklyChange: number; weeksToGoal: number | null }) | null;
}

const fmt = (n: number, digits = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: digits });

/** Side panel with the formula numbers, updating as the wizard is filled in. */
export default function LivePreview({ preview }: Props) {
  return (
    <aside aria-label="Canlı önizleme" aria-live="polite" className="card p-4 sm:p-6">
      <h2 className="section-title flex items-center gap-2">
        <Activity aria-hidden className="size-4 text-accent" /> Canlı önizleme
      </h2>
      {!preview ? (
        <p className="mt-3 text-[13px] text-fg-muted">Boy, kilo ve yaşını girdiğinde metabolizma hesabın burada anlık görünecek.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-fg-muted">Günlük hedef</p>
          <p className="font-display text-4xl tabular-nums">
            {fmt(preview.base.calories)} <span className="text-base text-fg-muted">kcal</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            {(
              [
                ["BMR", `${fmt(preview.bmr)} kcal`],
                ["TDEE", `${fmt(preview.tdee)} kcal`],
                ["Protein", `${fmt(preview.base.protein)} g`],
                [
                  "Haftalık değişim",
                  preview.weeklyChange === 0 ? "Denge" : `${preview.weeklyChange > 0 ? "+" : ""}${fmt(preview.weeklyChange, 2)} kg`,
                ],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="tile">
                <dt className="tile-label">{label}</dt>
                <dd className="tile-value">{value}</dd>
              </div>
            ))}
          </dl>
          {preview.cycle && (
            <p className="mt-3 text-xs text-fg-muted tabular-nums">
              Antrenman günü {fmt(preview.cycle.training.calories)} kcal · Dinlenme günü {fmt(preview.cycle.rest.calories)} kcal
            </p>
          )}
          {preview.weeksToGoal !== null && (
            <p className="mt-3 rounded-[6px] bg-accent-soft px-3 py-2 text-xs text-accent-text">
              Bu tempoyla hedef kilona yaklaşık <strong>{preview.weeksToGoal} haftada</strong> ulaşırsın.
            </p>
          )}
          <p className="mt-3 text-[11px] text-fg-subtle">Harris-Benedict formülüyle hesaplanır; AI koç son planda ince ayar yapar.</p>
        </>
      )}
    </aside>
  );
}
