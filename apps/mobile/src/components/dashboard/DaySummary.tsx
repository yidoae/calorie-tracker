import { MACRO_LABELS } from "@calorie/core/labels";
import type { Macros } from "@calorie/core/schemas/nutrition";
import { StyleSheet, View } from "react-native";
import MacroTile from "@/components/ui/MacroTile";
import { colors, space } from "@/theme";

interface Props {
  eaten: Macros;
  targets: Macros;
}

const MACROS = [
  { key: "protein", color: colors.macroProtein, tint: colors.proteinSoft },
  { key: "carbs", color: colors.macroCarbs, tint: colors.carbsSoft },
  { key: "fat", color: colors.macroFat, tint: colors.fatSoft },
] as const;

/** The day's macros at a glance (FR-018): three tinted tiles, eaten against the targets. The calories sit in the band (DayHero). */
export default function DaySummary({ eaten, targets }: Props) {
  return (
    <View style={styles.row}>
      {MACROS.map(({ key, color, tint }) => (
        <MacroTile key={key} label={MACRO_LABELS[key]} value={eaten[key]} target={targets[key]} color={color} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space(2) },
});
