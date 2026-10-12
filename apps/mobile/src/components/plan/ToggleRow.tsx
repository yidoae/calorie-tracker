import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/** A labelled on/off switch in a soft box; the whole row toggles it. */
export default function ToggleRow({ label, description, value, onChange, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={[styles.label, disabled && styles.muted]}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surface3, true: colors.cta }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.surface3}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    padding: space(4),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
  },
  text: { flex: 1, gap: space(0.5) },
  label: { ...type.bodyStrong, color: colors.fg },
  muted: { color: colors.fgSubtle },
  description: { ...type.small, color: colors.fgMuted },
});
