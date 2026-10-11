import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  /** 1-based number of the current step. */
  current: number;
  total: number;
}

/** "Adım 2 / 6" with one segment per step. */
export default function SetupProgress({ current, total }: Props) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Adım ${current} / ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={styles.wrap}
    >
      <Text style={styles.label}>
        ADIM {current} / {total}
      </Text>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < current && styles.done]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  label: { ...type.label, color: colors.fgMuted },
  segments: { flexDirection: "row", gap: space(1) },
  segment: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surface3 },
  done: { backgroundColor: colors.cta },
});
