import { MACRO_LABELS } from "@calorie/core/labels";
import type { Macros } from "@calorie/core/schemas/nutrition";
import { StyleSheet, Text, View } from "react-native";
import MacroBar from "@/components/ui/MacroBar";
import Ring from "@/components/ui/Ring";
import { colors, radius, space, type } from "@/theme";

interface Props {
  eaten: Macros;
  targets: Macros;
  dayType: "training" | "rest" | null;
}

const MACROS = [
  { key: "protein", color: colors.macroProtein },
  { key: "carbs", color: colors.macroCarbs },
  { key: "fat", color: colors.macroFat },
] as const;

const DAY_TYPE = { training: "Antrenman günü", rest: "Dinlenme günü" } as const;

/** The day at a glance (FR-018): the calorie ring and the three macro bars, eaten against the targets. */
export default function DaySummary({ eaten, targets, dayType }: Props) {
  return (
    <>
      <View style={styles.ring}>
        <Ring value={eaten.calories} target={targets.calories} />
        {dayType && <Text style={styles.dayType}>{DAY_TYPE[dayType]}</Text>}
      </View>
      <View style={styles.card}>
        {MACROS.map(({ key, color }) => (
          <MacroBar key={key} label={MACRO_LABELS[key]} value={eaten[key]} target={targets[key]} color={color} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: "center", gap: space(2), paddingVertical: space(2) },
  dayType: { ...type.label, color: colors.fgMuted },
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(4) },
});
