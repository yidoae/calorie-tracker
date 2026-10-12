import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Shown under the field in red and announced; the border turns red (FR-007, FR-013). */
  error?: string | null;
  hint?: string;
  /** Unit shown inside the field on the right, e.g. "g", "kg", "cm". */
  unit?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoComplete?: "email" | "password" | "new-password" | "off";
  autoFocus?: boolean;
  /** Stable id for the Maestro smoke flow (.maestro/smoke.yaml). */
  testID?: string;
}

export default function TextField({ label, value, onChangeText, placeholder, error, hint, unit, keyboardType, secureTextEntry, autoComplete = "off", autoFocus, testID }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.fgSubtle}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoFocus={autoFocus}
          style={styles.input}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(1.5) },
  label: { ...type.small, color: colors.fg, fontWeight: "600" },
  field: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space(4),
  },
  fieldError: { borderColor: colors.danger, borderWidth: 2 },
  input: { ...type.body, flex: 1, color: colors.fg, paddingVertical: space(3) },
  unit: { ...type.bodyStrong, color: colors.fgMuted, marginLeft: space(2) },
  error: { ...type.small, color: colors.dangerText },
  hint: { ...type.small, color: colors.fgMuted },
});
