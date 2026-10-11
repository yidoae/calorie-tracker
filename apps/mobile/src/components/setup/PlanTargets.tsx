import { LOCALE } from "@calorie/core/dates";
import { GOAL_LABELS, MACRO_LABELS } from "@calorie/core/labels";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  plan: Pick<NutritionPlan, "inputs" | "base" | "strategySummary">;
}

const MACROS = [
  { key: "protein", color: colors.macroProtein },
  { key: "carbs", color: colors.macroCarbs },
  { key: "fat", color: colors.macroFat },
] as const;

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** The computed daily targets at the end of the setup: calories, the three macros and the strategy. */
export default function PlanTargets({ plan }: Props) {
  const goal = GOAL_LABELS[plan.inputs.goal];
  return (
    <View style={styles.wrap}>
      <View style={styles.hero} accessible accessibilityLabel={`Günlük hedefin ${fmt(plan.base.calories)} kilokalori, ${goal.title}`}>
        <Text style={styles.eyebrow}>GÜNLÜK HEDEFİN</Text>
        <Text style={styles.kcal}>{fmt(plan.base.calories)} kcal</Text>
        <Text style={styles.goal}>
          {goal.title} · {goal.hint}
        </Text>
      </View>
      <View style={styles.macros}>
        {MACROS.map(({ key, color }) => (
          <View key={key} style={styles.macro} accessible accessibilityLabel={`${MACRO_LABELS[key]} ${fmt(plan.base[key])} gram`}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.macroValue}>{fmt(plan.base[key])} g</Text>
            <Text style={styles.macroLabel}>{MACRO_LABELS[key]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.summary}>{plan.strategySummary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(4) },
  hero: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space(5), gap: space(1) },
  eyebrow: { ...type.label, color: colors.cta },
  kcal: { ...type.displayXl, color: colors.onInk },
  goal: { ...type.body, color: colors.onInkMuted },
  macros: { flexDirection: "row", gap: space(3) },
  macro: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(3), gap: space(1) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  macroValue: { ...type.displayMd, color: colors.fg },
  macroLabel: { ...type.small, color: colors.fgMuted },
  summary: { ...type.body, color: colors.fgMuted },
});
