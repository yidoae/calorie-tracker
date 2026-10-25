import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
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
  /** Several lines and a character limit, for free text (003 meal description). */
  multiline?: boolean;
  maxLength?: number;
  /** Stable id for the Maestro smoke flow (.maestro/smoke.yaml). */
  testID?: string;
  /** −/+ buttons inside the field for numbers (design proposal K7); the caller computes the next value. */
  stepper?: { onStep: (delta: 1 | -1) => void; less: string; more: string };
}

export default function TextField({ label, value, onChangeText, placeholder, error, hint, unit, keyboardType, secureTextEntry, autoComplete = "off", autoFocus, multiline, maxLength, testID, stepper }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, stepper && styles.fieldStepper, error ? styles.fieldError : null]}>
        {stepper && <StepButton label={stepper.less} symbol="−" onPress={() => stepper.onStep(-1)} />}
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
          multiline={multiline}
          maxLength={maxLength}
          style={[styles.input, stepper && styles.inputStepper]}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
        {stepper && <StepButton label={stepper.more} symbol="+" onPress={() => stepper.onStep(1)} />}
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

function StepButton({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}>
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
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
  fieldStepper: { paddingHorizontal: space(1) },
  fieldError: { borderColor: colors.danger, borderWidth: 2 },
  input: { ...type.body, flex: 1, minWidth: 0, color: colors.fg, paddingVertical: space(3) },
  inputStepper: { ...type.displayMd, textAlign: "center" },
  step: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  stepPressed: { backgroundColor: colors.surface2 },
  stepSymbol: { ...type.displayMd, color: colors.fg },
  unit: { ...type.bodyStrong, color: colors.fgMuted, marginLeft: space(2) },
  error: { ...type.small, color: colors.dangerText },
  hint: { ...type.small, color: colors.fgMuted },
});
