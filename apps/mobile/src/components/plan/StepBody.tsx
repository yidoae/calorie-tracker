import { GOAL_LABELS } from "@calorie/core/labels";
import { calorieFloor, weeklyChangeKg } from "@calorie/core/nutrition/plan";
import { INTENSITY_RANGE, PLAN_GOALS } from "@calorie/core/schemas/plan";
import { StyleSheet, Text, View } from "react-native";
import { formatKcal } from "@/components/meals/format";
import ChoiceCard from "@/components/setup/ChoiceCard";
import Slider from "@/components/ui/Slider";
import TextField from "@/components/ui/TextField";
import type { PlanWizard } from "@/hooks/usePlanWizard";
import { colors, space, type } from "@/theme";
import Field from "./Field";
import { formatWeeklyChange } from "./format";

type NumberKey = "heightCm" | "weightKg" | "age" | "targetWeightKg";

const SEX_LABELS = { female: "Kadın", male: "Erkek" } as const;

/** Step 1: body data, goal and how hard to push (deficit/surplus slider with the weekly change). */
export default function StepBody({ w }: { w: PlanWizard }) {
  const { form } = w;
  // Empty fields complain only after "Devam"; a typed value is checked at once.
  const error = (key: NumberKey) => (w.showErrors || form[key].trim() !== "" ? w.errors[key] : null);
  const range = form.goal === "maintain" ? null : INTENSITY_RANGE[form.goal];
  const change = weeklyChangeKg(form.goal === "cut" ? -form.intensity : form.intensity);
  const sign = form.goal === "cut" ? "−" : "+";

  return (
    <>
      <Text style={styles.note}>
        {SEX_LABELS[form.sex]} · cinsiyet profilinden gelir; günlük kalorin hiçbir gün {formatKcal(calorieFloor(form.sex))} kcal altına inmez.
      </Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <TextField label="Boy" value={form.heightCm} onChangeText={(t) => w.set("heightCm", t)} keyboardType="decimal-pad" unit="cm" error={error("heightCm")} />
        </View>
        <View style={styles.cell}>
          <TextField label="Kilo" value={form.weightKg} onChangeText={(t) => w.set("weightKg", t)} keyboardType="decimal-pad" unit="kg" error={error("weightKg")} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <TextField label="Yaş" value={form.age} onChangeText={(t) => w.set("age", t)} keyboardType="number-pad" unit="yaş" error={error("age")} />
        </View>
        <View style={styles.cell}>
          <TextField
            label="Hedef kilo"
            value={form.targetWeightKg}
            onChangeText={(t) => w.set("targetWeightKg", t)}
            keyboardType="decimal-pad"
            unit="kg"
            error={error("targetWeightKg")}
            hint="İsteğe bağlı"
          />
        </View>
      </View>

      <Field label="Hedefin" error={w.errors.targetDirection} radiogroup>
        {PLAN_GOALS.map((goal) => (
          <ChoiceCard key={goal} title={GOAL_LABELS[goal].title} hint={GOAL_LABELS[goal].hint} selected={form.goal === goal} onPress={() => w.setGoal(goal)} />
        ))}
      </Field>

      {range && (
        <Field
          label={form.goal === "cut" ? "Kalori açığı" : "Kalori fazlası"}
          value={`${sign}${form.intensity} kcal/gün`}
          hint={`Tahmini haftalık değişim: ${formatWeeklyChange(change)}`}
        >
          <Slider
            label={form.goal === "cut" ? "Kalori açığı" : "Kalori fazlası"}
            value={form.intensity}
            min={range.min}
            max={range.max}
            step={range.step}
            onChange={w.setIntensity}
            valueText={`${form.intensity} kilokalori, haftada ${formatWeeklyChange(change)}`}
            color={form.goal === "cut" ? colors.macroProtein : colors.ink}
          />
          <View style={styles.ends}>
            <Text style={styles.endLabel}>{form.goal === "cut" ? "SÜRDÜRÜLEBİLİR" : "TEMİZ / YAVAŞ"}</Text>
            <Text style={styles.endLabel}>AGRESİF</Text>
          </View>
        </Field>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  note: { ...type.small, color: colors.fgMuted },
  row: { flexDirection: "row", gap: space(3) },
  cell: { flex: 1 },
  ends: { flexDirection: "row", justifyContent: "space-between" },
  endLabel: { ...type.label, color: colors.fgSubtle },
});
