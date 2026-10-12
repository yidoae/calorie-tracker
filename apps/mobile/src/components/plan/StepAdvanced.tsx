import { DIET_STYLE_LABELS, GOAL_LABELS, MEAL_PATTERN_LABELS, TRAINING_STYLE_LABELS, WEEKDAY_SHORT } from "@calorie/core/labels";
import { StyleSheet, Text, View } from "react-native";
import type { PlanWizard } from "@/hooks/usePlanWizard";
import { colors, radius, space, type } from "@/theme";
import DayTile from "./DayTile";
import { formatWindow } from "./format";
import ToggleRow from "./ToggleRow";

/** Step 4: calorie cycling (with the training/rest numbers) and a summary of the answers. */
export default function StepAdvanced({ w }: { w: PlanWizard }) {
  const { form, preview } = w;
  const sedentary = form.trainingStyle === "sedentary";
  const days = form.trainingDays.length;

  const summary: [string, string][] = [
    ["Vücut", `${form.sex === "male" ? "Erkek" : "Kadın"} · ${form.heightCm} cm · ${form.weightKg} kg · ${form.age} yaş`],
    ["Hedef", `${GOAL_LABELS[form.goal].title}${form.goal !== "maintain" ? ` (${form.goal === "cut" ? "−" : "+"}${form.intensity} kcal)` : ""}`],
    ["Antrenman", sedentary ? TRAINING_STYLE_LABELS.sedentary : `${TRAINING_STYLE_LABELS[form.trainingStyle]} · ${form.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ")}`],
    ["Beslenme", DIET_STYLE_LABELS[form.dietStyle]],
    ["Öğün düzeni", form.mealPattern === "if168" ? `16:8 · ${formatWindow(form.fastingWindowStart)}` : MEAL_PATTERN_LABELS.classic.hint],
  ];

  return (
    <>
      <ToggleRow
        label="Kalori döngüsü"
        description={
          sedentary
            ? "Döngü için en az 2 antrenman günü gerekir."
            : "Antrenman günlerinde daha fazla kalori ve karbonhidrat, dinlenme günlerinde daha az. Haftalık toplam aynı kalır."
        }
        value={form.cycling}
        onChange={(v) => w.set("cycling", v)}
        disabled={sedentary}
      />

      {form.cycling && preview?.cycle && (
        <View style={styles.days}>
          <DayTile title={`Antrenman günü · ${days} gün`} kcal={preview.cycle.training.calories} detail={`K ${preview.cycle.training.carbs} g · Y ${preview.cycle.training.fat} g`} />
          <DayTile title={`Dinlenme günü · ${7 - days} gün`} kcal={preview.cycle.rest.calories} detail={`K ${preview.cycle.rest.carbs} g · Y ${preview.cycle.rest.fat} g`} />
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>ÖZETİN</Text>
        {summary.map(([label, value]) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: "row", gap: space(3) },
  summary: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space(4), gap: space(2) },
  summaryTitle: { ...type.label, color: colors.fgMuted },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: space(4) },
  summaryLabel: { ...type.small, color: colors.fgMuted },
  summaryValue: { ...type.small, color: colors.fg, fontWeight: "600", flexShrink: 1, textAlign: "right" },
});
