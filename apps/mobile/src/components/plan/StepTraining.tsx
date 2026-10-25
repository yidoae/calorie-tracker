import { SPLIT_LABELS, TRAINING_STYLE_HINTS, TRAINING_STYLE_LABELS } from "@calorie/core/labels";
import { STRENGTH_SPLITS, TRAINING_STYLES } from "@calorie/core/schemas/plan";
import ChoiceCard from "@/components/setup/ChoiceCard";
import Segmented from "@/components/ui/Segmented";
import WeekdayPicker from "@/components/ui/WeekdayPicker";
import type { PlanWizard } from "@/hooks/usePlanWizard";
import Field from "./Field";

const FREQUENCIES = [2, 3, 4, 5, 6].map((n) => ({ id: n, label: `${n} gün`, accessibilityLabel: `Haftada ${n} gün` }));

/** Step 2: training style (with the split for weights), how many days and which ones. */
export default function StepTraining({ w }: { w: PlanWizard }) {
  const { form } = w;
  const sedentary = form.trainingStyle === "sedentary";
  const daysError = w.errors.trainingDays;

  return (
    <>
      <Field label="Antrenman tarzın" radiogroup>
        {TRAINING_STYLES.map((style) => (
          <ChoiceCard
            key={style}
            title={TRAINING_STYLE_LABELS[style]}
            hint={TRAINING_STYLE_HINTS[style]}
            selected={form.trainingStyle === style}
            onPress={() => w.setTrainingStyle(style)}
          />
        ))}
      </Field>

      {form.trainingStyle === "strength" && (
        <Field label="Program tipi">
          <Segmented items={STRENGTH_SPLITS.map((id) => ({ id, label: SPLIT_LABELS[id] }))} value={form.split} onChange={w.setSplit} label="Program tipi" />
        </Field>
      )}

      <Field label="Haftada kaç gün?">
        <Segmented items={FREQUENCIES} value={sedentary ? null : form.trainingDays.length} onChange={w.setFrequency} label="Haftada kaç gün" disabled={sedentary} />
      </Field>

      <Field
        label="Hangi günler?"
        error={daysError}
        hint={
          sedentary
            ? "Düşük harekette antrenman günü hesaba katılmaz."
            : `${form.trainingDays.length} antrenman günü · kalori döngüsü açılırsa bu günlerde daha fazla karbonhidrat alırsın.`
        }
      >
        <WeekdayPicker value={form.trainingDays} onToggle={w.toggleDay} disabled={sedentary} />
      </Field>
    </>
  );
}

