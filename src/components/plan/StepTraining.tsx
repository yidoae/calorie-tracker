import { Activity, Armchair, Dumbbell, Zap } from "lucide-react";
import type { usePlanWizard } from "@/hooks/usePlanWizard";
import { SPLIT_LABELS, TRAINING_STYLE_HINTS, TRAINING_STYLE_LABELS, WEEKDAY_SHORT } from "@/lib/labels";
import { STRENGTH_SPLITS, TRAINING_DAYS_RANGE, TRAINING_STYLES, type TrainingStyle } from "@/types/plan";
import ChoiceCard from "../ui/ChoiceCard";

type Wizard = ReturnType<typeof usePlanWizard>;

const STYLE_ICONS: Record<TrainingStyle, React.ReactNode> = {
  strength: <Dumbbell className="size-5" />,
  functional: <Zap className="size-5" />,
  cardio: <Activity className="size-5" />,
  sedentary: <Armchair className="size-5" />,
};

const FREQUENCIES = [2, 3, 4, 5, 6];

/** Step 2: training school (with split for weights), weekly frequency and which days. */
export default function StepTraining({ w }: { w: Wizard }) {
  const { form } = w;
  const sedentary = form.trainingStyle === "sedentary";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">Antrenman ekolün</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {TRAINING_STYLES.map((style) => (
            <ChoiceCard
              key={style}
              selected={form.trainingStyle === style}
              onSelect={() => w.setTrainingStyle(style)}
              title={TRAINING_STYLE_LABELS[style]}
              hint={TRAINING_STYLE_HINTS[style]}
              icon={STYLE_ICONS[style]}
            >
              {style === "strength" && form.trainingStyle === "strength" && (
                <div role="radiogroup" aria-label="Program tipi" className="mt-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  {STRENGTH_SPLITS.map((split) => (
                    <button
                      key={split}
                      type="button"
                      role="radio"
                      aria-checked={form.split === split}
                      onClick={() => w.setSplit(split)}
                      className={`h-7 cursor-pointer rounded-full border px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                        form.split === split ? "border-ink bg-ink text-on-ink" : "border-border text-fg-muted hover:border-border-strong"
                      }`}
                    >
                      {SPLIT_LABELS[split]}
                    </button>
                  ))}
                </div>
              )}
            </ChoiceCard>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={sedentary}>
        <legend className={`label ${sedentary ? "text-fg-subtle" : ""}`}>Haftada kaç gün?</legend>
        <div role="radiogroup" className="grid grid-cols-5 gap-1 rounded-[6px] border border-border-strong bg-surface p-1">
          {FREQUENCIES.map((n) => {
            const active = !sedentary && form.trainingDays.length === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => w.setFrequency(n)}
                className={`h-9 cursor-pointer rounded-[4px] text-sm font-semibold tabular-nums outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-fg-subtle ${
                  active ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"
                }`}
              >
                {n} gün
              </button>
            );
          })}
        </div>

        <p className={`label mt-4 ${sedentary ? "text-fg-subtle" : ""}`}>Hangi günler?</p>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_SHORT.map((day, i) => {
            const on = form.trainingDays.includes(i);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => w.toggleDay(i)}
                className={`h-11 cursor-pointer rounded-[6px] border text-xs font-semibold outline-none transition-[background-color,border-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-fg-subtle ${
                  on ? "border-cta bg-cta text-cta-fg" : "border-border bg-surface text-fg-muted hover:border-border-strong"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        {sedentary ? (
          <p className="hint">Düşük hareket seçildiğinde antrenman günü hesaba katılmaz.</p>
        ) : w.errors.trainingDays ? (
          <p className="error-text">
            Haftada {TRAINING_DAYS_RANGE.min}–{TRAINING_DAYS_RANGE.max} gün seç.
          </p>
        ) : (
          <p className="hint">{form.trainingDays.length} antrenman günü · kalori döngüsü açılırsa bu günlerde daha fazla karbonhidrat alırsın.</p>
        )}
      </fieldset>
    </div>
  );
}
