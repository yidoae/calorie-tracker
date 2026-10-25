import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@calorie/core/labels";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  /** The days that are on, Monday = 0. */
  value: readonly number[];
  onToggle: (day: number) => void;
  disabled?: boolean;
}

/** Seven Monday-first day toggles (plan wizard training days, 008 program weekdays). */
export default function WeekdayPicker({ value, onToggle, disabled = false }: Props) {
  return (
    <View style={styles.days}>
      {WEEKDAY_SHORT.map((day, i) => {
        const on = value.includes(i);
        return (
          <Pressable
            key={day}
            accessibilityRole="checkbox"
            accessibilityLabel={WEEKDAY_NAMES[i]}
            accessibilityState={{ checked: on, disabled }}
            disabled={disabled}
            onPress={() => onToggle(i)}
            style={[styles.day, on && styles.dayOn, disabled && styles.dayOff]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.dayLabel, on && styles.dayLabelOn, disabled && styles.dayLabelOff]}>
              {day}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // A narrow gap so seven 44 pt days fit from a 360 pt wide screen up.
  days: { flexDirection: "row", gap: space(0.5) },
  day: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  dayOn: { backgroundColor: colors.cta, borderColor: colors.cta },
  dayOff: { backgroundColor: colors.surface2 },
  dayLabel: { ...type.small, fontWeight: "600", color: colors.fgMuted },
  dayLabelOn: { color: colors.ctaFg },
  dayLabelOff: { color: colors.fgSubtle },
});
