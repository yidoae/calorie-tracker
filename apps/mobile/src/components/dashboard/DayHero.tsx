import { LOCALE } from "@calorie/core/dates";
import { progressOf } from "@calorie/core/nutrition/macros";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  /** kcal eaten so far. */
  eaten: number;
  /** The day's calorie target. */
  target: number;
  dayType: "training" | "rest" | null;
}

const DAY_TYPE = { training: "Antrenman günü", rest: "Dinlenme günü" } as const;
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** The day's calories in the ink band (design proposal K3): what is left as the one big number, eaten as a lime bar; red once over. */
export default function DayHero({ eaten, target, dayType }: Props) {
  const left = target - eaten;
  const over = left < 0;
  const share = progressOf(eaten, target);
  const status = over ? `${fmt(-left)} kcal fazla` : `${fmt(left)} kcal kaldı`;

  return (
    <View
      testID="calorie-summary"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Kalori: ${fmt(eaten)} / ${fmt(target)} kcal, ${status}`}
      accessibilityValue={{ min: 0, max: Math.round(target), now: Math.round(eaten) }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <View>
          <Text maxFontSizeMultiplier={1.3} style={[styles.number, over && styles.over]}>
            {fmt(Math.abs(left))}
          </Text>
          <Text style={[styles.caption, over && styles.over]}>{over ? "kcal fazla" : "kcal kaldı"}</Text>
        </View>
        <View style={styles.side}>
          {dayType && <Text style={styles.caption}>{DAY_TYPE[dayType]}</Text>}
          <Text style={styles.detail}>
            {fmt(eaten)} / {fmt(target)} kcal
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${share * 100}%` }, over && styles.fillOver]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(3), marginTop: space(3) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: space(3) },
  number: { ...type.displayXl, fontSize: 48, lineHeight: 52, color: colors.onInk },
  over: { color: colors.dangerSoft },
  caption: { ...type.small, color: colors.onInkMuted },
  side: { alignItems: "flex-end", gap: space(0.5) },
  detail: { ...type.bodyStrong, color: colors.onInk },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.ink2, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.cta },
  fillOver: { backgroundColor: colors.danger },
});
