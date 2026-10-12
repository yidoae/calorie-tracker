import { LOCALE } from "@calorie/core/dates";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, space, type } from "@/theme";

interface Props {
  /** kcal eaten so far. */
  value: number;
  /** The day's calorie target. */
  target: number;
  size?: number;
}

const STROKE = 14;
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** The day's calories as a ring: the eaten share of the target; the centre says what is left. */
export default function Ring({ value, target, size = 200 }: Props) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = target > 0 ? Math.min(value / target, 1) : 0;
  const left = target - value;
  const over = left < 0;
  const status = over ? `${fmt(-left)} kcal fazla` : `${fmt(left)} kcal kaldı`;

  return (
    <View
      testID="calorie-ring"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Kalori: ${fmt(value)} / ${fmt(target)} kcal, ${status}`}
      accessibilityValue={{ min: 0, max: Math.round(target), now: Math.round(value) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surface3} strokeWidth={STROKE} fill={colors.transparent} />
        {share > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={over ? colors.danger : colors.macroCalories}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - share)}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
            fill={colors.transparent}
          />
        )}
      </Svg>
      {/* Large text would spill out of the circle; the label above carries the full numbers. */}
      <View style={[StyleSheet.absoluteFill, styles.centre]}>
        <Text maxFontSizeMultiplier={1.2} style={[styles.number, over && styles.over]}>{fmt(Math.abs(left))}</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.caption}>{over ? "kcal fazla" : "kcal kaldı"}</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.detail}>
          {fmt(value)} / {fmt(target)} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center", gap: space(0.5) },
  number: { ...type.displayXl, color: colors.fg },
  over: { color: colors.dangerText },
  caption: { ...type.bodyStrong, color: colors.fgMuted },
  detail: { ...type.small, color: colors.fgMuted },
});
