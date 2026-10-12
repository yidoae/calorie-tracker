import { LOCALE } from "@calorie/core/dates";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  label: string;
  /** Grams eaten so far. */
  value: number;
  /** The day's target in grams. */
  target: number;
  /** The macro's colour from the theme (colors.macroProtein, …). */
  color: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** One macronutrient: eaten against the target as a bar, with the numbers above it. */
export default function MacroBar({ label, value, target, color }: Props) {
  const share = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${fmt(value)} / ${fmt(target)} g`}
      accessibilityValue={{ min: 0, max: Math.round(target), now: Math.round(value) }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.amount}>
          {fmt(value)} / {fmt(target)} g
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(1.5) },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { ...type.bodyStrong, color: colors.fg },
  amount: { ...type.small, color: colors.fgMuted },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.pill },
});
