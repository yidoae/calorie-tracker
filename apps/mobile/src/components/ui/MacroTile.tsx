import { LOCALE } from "@calorie/core/dates";
import { progressOf } from "@calorie/core/nutrition/macros";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  label: string;
  /** Grams eaten so far. */
  value: number;
  /** The day's target in grams. */
  target: number;
  /** The macro's colour and its light tint from the theme (colors.macroProtein / colors.proteinSoft, …). */
  color: string;
  tint: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** One macronutrient as a tinted tile (design proposal K1): grams left (or over, in red) as the number, eaten / target and a bar under it. */
export default function MacroTile({ label, value, target, color, tint }: Props) {
  const left = target - value;
  const over = left < 0;
  const share = progressOf(value, target);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${fmt(value)} / ${fmt(target)} g, ${fmt(Math.abs(left))} g ${over ? "fazla" : "kaldı"}`}
      accessibilityValue={{ min: 0, max: Math.round(target), now: Math.round(value) }}
      style={[styles.tile, { backgroundColor: tint }]}
    >
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Text maxFontSizeMultiplier={1.3} style={[styles.number, over && styles.over]}>
        {fmt(Math.abs(left))} g
      </Text>
      {/* Two lines instead of one truncated "kaldı · 120/1…" line: three tiles leave ~70 pt each on a 360 pt phone. */}
      <Text style={styles.detail}>
        <Text style={over && styles.over}>{over ? "fazla" : "kaldı"}</Text>
        {"\n"}
        {fmt(value)}/{fmt(target)} g
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, over ? styles.fillOver : { width: `${share * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, borderRadius: radius.md, padding: space(3), gap: space(0.5) },
  label: { ...type.label, letterSpacing: 0, color: colors.fgMuted },
  number: { ...type.displayMd, color: colors.fg },
  detail: { ...type.small, color: colors.fgMuted, marginBottom: space(1) },
  over: { color: colors.dangerText },
  track: { height: 6, marginTop: "auto", borderRadius: radius.pill, backgroundColor: colors.surface, overflow: "hidden" },
  fill: { height: 6, borderRadius: radius.pill },
  fillOver: { width: "100%", backgroundColor: colors.danger },
});
