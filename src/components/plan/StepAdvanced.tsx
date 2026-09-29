import { Moon, Zap } from "lucide-react";
import type { usePlanWizard } from "@/hooks/usePlanWizard";
import { DIET_STYLE_LABELS, GOAL_LABELS, MEAL_PATTERN_LABELS, TRAINING_STYLE_LABELS, WEEKDAY_SHORT } from "@/lib/labels";
import Switch from "../ui/Switch";

type Wizard = ReturnType<typeof usePlanWizard>;

const fmt = (n: number) => n.toLocaleString("tr-TR");

/** Step 4: calorie cycling toggle (with a live training/rest preview) and a summary of the answers. */
export default function StepAdvanced({ w }: { w: Wizard }) {
  const { form, preview } = w;
  const sedentary = form.trainingStyle === "sedentary";

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-border bg-surface-2 p-4">
        <Switch
          id="plan-cycling"
          checked={form.cycling}
          onChange={(v) => w.set("cycling", v)}
          disabled={sedentary}
          label="Antrenman / dinlenme günü kalori döngüsü uygula"
          description={
            sedentary
              ? "Döngü için en az 2 antrenman günü gerekir."
              : "Antrenman günlerinde daha fazla kalori ve karbonhidrat, dinlenme günlerinde daha az kalori ve görece daha fazla yağ. Haftalık toplam aynı kalır."
          }
        />

        {form.cycling && preview?.cycle && (
          <div className="mt-4 grid animate-enter gap-2 sm:grid-cols-2">
            <div className="rounded-[10px] border border-border bg-surface p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
                <Zap aria-hidden className="size-4 text-accent" /> Antrenman günü · {form.trainingDays.length} gün
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums">{fmt(preview.cycle.training.calories)} kcal</p>
              <p className="text-xs text-fg-muted tabular-nums">
                K {preview.cycle.training.carbs} g · Y {preview.cycle.training.fat} g
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-surface p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
                <Moon aria-hidden className="size-4 text-macro-protein" /> Dinlenme günü · {7 - form.trainingDays.length} gün
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums">{fmt(preview.cycle.rest.calories)} kcal</p>
              <p className="text-xs text-fg-muted tabular-nums">
                K {preview.cycle.rest.carbs} g · Y {preview.cycle.rest.fat} g
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="section-title">Özetin</p>
        <dl className="mt-3 divide-y divide-border rounded-[10px] border border-border">
          {(
            [
              ["Vücut", `${form.sex === "male" ? "Erkek" : "Kadın"} · ${form.heightCm} cm · ${form.weightKg} kg · ${form.age} yaş`],
              ["Hedef", `${GOAL_LABELS[form.goal].title}${form.goal !== "maintain" ? ` (${form.goal === "cut" ? "−" : "+"}${form.intensity} kcal)` : ""}`],
              [
                "Antrenman",
                sedentary
                  ? TRAINING_STYLE_LABELS.sedentary
                  : `${TRAINING_STYLE_LABELS[form.trainingStyle]} · ${form.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ")}`,
              ],
              ["Diyet", DIET_STYLE_LABELS[form.dietStyle]],
              ["Öğün düzeni", form.mealPattern === "if168" ? `16:8 · ${form.fastingWindowStart}:00–${form.fastingWindowStart + 8}:00` : MEAL_PATTERN_LABELS.classic.hint],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-2 text-[13px]">
              <dt className="shrink-0 text-fg-muted">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
