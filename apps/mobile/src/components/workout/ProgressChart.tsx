import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import type { ProgressEntry } from "@/hooks/workoutLogic";
import { formatKg } from "@/hooks/workoutLogic";
import { colors, space, type } from "@/theme";

const HEIGHT = 160;
const PAD = 10;

/** The heaviest set of each workout as a line, oldest on the left; the lightest and heaviest are labelled. */
export default function ProgressChart({ entries }: { entries: ProgressEntry[] }) {
  const [width, setWidth] = useState(0);
  const kgs = entries.map((e) => e.topKg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const x = (i: number) => (entries.length === 1 ? width / 2 : PAD + (i * (width - 2 * PAD)) / (entries.length - 1));
  const y = (kg: number) => (max === min ? HEIGHT / 2 : PAD + ((max - kg) * (HEIGHT - 2 * PAD)) / (max - min));
  const points = entries.map((e, i) => `${x(i)},${y(e.topKg)}`).join(" ");

  return (
    <View
      accessible
      accessibilityLabel={`Kilo grafiği: ${entries.length} antrenman, ilk ${formatKg(kgs[0])} kilo, son ${formatKg(kgs.at(-1)!)} kilo, en yüksek ${formatKg(max)} kilo`}
      style={styles.wrap}
    >
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{formatKg(max)} kg</Text>
        <Text style={styles.axisLabel}>{formatKg(min)} kg</Text>
      </View>
      <View style={styles.plot} onLayout={(ev) => setWidth(ev.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Line x1={0} y1={y(max)} x2={width} y2={y(max)} stroke={colors.border} strokeWidth={1} />
            <Line x1={0} y1={y(min)} x2={width} y2={y(min)} stroke={colors.border} strokeWidth={1} />
            <Polyline points={points} stroke={colors.macroCalories} strokeWidth={2.5} fill={colors.transparent} />
            {entries.map((e, i) => (
              <Circle key={i} cx={x(i)} cy={y(e.topKg)} r={4} fill={i === entries.length - 1 ? colors.cta : colors.macroCalories} stroke={colors.macroCalories} strokeWidth={1.5} />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: space(2) },
  axis: { height: HEIGHT, justifyContent: "space-between", paddingVertical: PAD - 8 },
  axisLabel: { ...type.small, color: colors.fgMuted },
  plot: { flex: 1, height: HEIGHT },
});
