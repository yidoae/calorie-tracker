import type { Macros } from "@calorie/core/schemas/nutrition";
import { StyleSheet, Text } from "react-native";
import { colors, type } from "@/theme";
import { formatGrams, formatKcal } from "./format";

interface Props {
  macros: Macros;
  /** Bold, larger kcal for a total. */
  strong?: boolean;
}

/** "248 kcal · P 46,5 g · K 0 g · Y 5,4 g", read out with the full macro names. */
export default function MacroLine({ macros, strong = false }: Props) {
  const kcal = formatKcal(macros.calories);
  const [p, c, f] = [formatGrams(macros.protein), formatGrams(macros.carbs), formatGrams(macros.fat)];
  return (
    <Text
      accessibilityLabel={`${kcal} kilokalori, protein ${p} gram, karbonhidrat ${c} gram, yağ ${f} gram`}
      style={[styles.line, strong && styles.strong]}
    >
      <Text style={styles.kcal}>{kcal} kcal</Text> · P {p} g · K {c} g · Y {f} g
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { ...type.small, color: colors.fgMuted },
  strong: { ...type.body, color: colors.fg },
  kcal: { fontWeight: "600", color: colors.fg },
});
