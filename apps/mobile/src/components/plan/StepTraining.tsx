import { SPLIT_LABELS, TRAINING_STYLE_HINTS, TRAINING_STYLE_LABELS, WEEKDAY_NAMES, WEEKDAY_SHORT } from "@calorie/core/labels";
import { STRENGTH_SPLITS, TRAINING_STYLES } from "@calorie/core/schemas/plan";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ChoiceCard from "@/components/setup/ChoiceCard";
import Segmented from "@/components/ui/Segmented";
import type { PlanWizard } from "@/hooks/usePlanWizard";
import { colors, radius, space, type } from "@/theme";
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
        <View style={styles.days}>
          {WEEKDAY_SHORT.map((day, i) => {
            const on = form.trainingDays.includes(i);
            return (
              <Pressable
                key={day}
                accessibilityRole="checkbox"
                accessibilityLabel={WEEKDAY_NAMES[i]}
                accessibilityState={{ checked: on, disabled: sedentary }}
                disabled={sedentary}
                onPress={() => w.toggleDay(i)}
                style={[styles.day, on && styles.dayOn, sedentary && styles.dayOff]}
              >
                <Text maxFontSizeMultiplier={1.3} style={[styles.dayLabel, on && styles.dayLabelOn, sedentary && styles.dayLabelOff]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  // A narrow gap so seven 44 pt days fit from a 360 pt wide screen up.
  days: { flexDirection: "row", gap: space(0.5) },
  day: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  dayOn: { backgroundColor: colors.cta, borderColor: colors.cta },
  dayOff: { backgroundColor: colors.surface2 },
  dayLabel: { ...type.small, fontWeight: "600", color: colors.fgMuted },
  dayLabelOn: { color: colors.ctaFg },
  dayLabelOff: { color: colors.fgSubtle },
});
