import { LOCALE } from "@calorie/core/dates";
import { StyleSheet, Text, View } from "react-native";
import Slider from "@/components/ui/Slider";
import { colors, space, type } from "@/theme";

interface Props {
  label: string;
  grams: number;
  range: { min: number; max: number; step: number };
  /** Share of the day's calories, 0–100. */
  percentOfCalories: number;
  /** g per kg of body weight, shown for protein and fat. */
  perKg?: number;
  color: string;
  onChange: (grams: number) => void;
}

const fmt1 = (n: number) => n.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** One macro on the tuning desk: grams, g/kg, share of calories and a slider in the macro's colour. */
export default function MacroSliderRow({ label, grams, range, percentOfCalories, perKg, color, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.name}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.meta}>
          {perKg !== undefined ? `${fmt1(perKg)} g/kg · ` : ""}%{Math.round(percentOfCalories)}
        </Text>
        <Text style={styles.grams}>{grams.toLocaleString(LOCALE)} g</Text>
      </View>
      <Slider
        label={label}
        value={grams}
        min={range.min}
        max={range.max}
        step={range.step}
        onChange={onChange}
        valueText={`${grams} gram${perKg !== undefined ? `, kilo başına ${fmt1(perKg)} gram` : ""}`}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(1) },
  head: { flexDirection: "row", alignItems: "baseline", gap: space(2) },
  name: { flex: 1, flexDirection: "row", alignItems: "center", gap: space(2) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...type.bodyStrong, color: colors.fg },
  meta: { ...type.small, color: colors.fgMuted },
  grams: { ...type.displayMd, color: colors.fg, minWidth: 72, textAlign: "right" },
});
