import { SLOT_LABELS } from "@calorie/core/labels";
import { MEAL_SLOTS, type MealSlot } from "@calorie/core/schemas/meal";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  value: MealSlot;
  onChange: (slot: MealSlot) => void;
}

/** Which meal of the day (FR-014): four chips, one selected. */
export default function SlotPicker({ value, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Öğün" style={styles.row}>
      {MEAL_SLOTS.map((slot) => {
        const selected = slot === value;
        return (
          <Pressable
            key={slot}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(slot)}
            style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && !selected && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{SLOT_LABELS[slot]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: space(2) },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space(4),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  pressed: { backgroundColor: colors.surface2 },
  label: { ...type.bodyStrong, color: colors.fg },
  selectedLabel: { color: colors.onInk },
});
