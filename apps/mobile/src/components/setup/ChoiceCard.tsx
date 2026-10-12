import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  title: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  /** Stable id for the Maestro smoke flow (.maestro/smoke.yaml). */
  testID?: string;
}

/** One answer of a single-choice question; the selected card gets a thick outline and a tick. */
export default function ChoiceCard({ title, hint, selected, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={hint ? `${title}, ${hint}` : title}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? colors.fg : colors.fgSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.borderStrong, borderWidth: 2, backgroundColor: colors.surface2 },
  pressed: { backgroundColor: colors.surface2 },
  text: { flex: 1, gap: space(0.5) },
  title: { ...type.bodyStrong, color: colors.fg },
  hint: { ...type.small, color: colors.fgMuted },
});
