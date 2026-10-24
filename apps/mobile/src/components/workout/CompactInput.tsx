import { StyleSheet, TextInput } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  /** Spoken label, e.g. "Bench press, 2. set, kilo"; the visible label is the column header. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Numbers by default; text for reps like "8-12". */
  keyboard?: "decimal" | "number" | "text";
}

/** A narrow field for tables of numbers (sets, reps, kg), 44 pt tall. */
export default function CompactInput({ label, value, onChangeText, placeholder, keyboard = "decimal" }: Props) {
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.fgSubtle}
      keyboardType={keyboard === "decimal" ? "decimal-pad" : keyboard === "number" ? "number-pad" : "default"}
      autoCapitalize="none"
      selectTextOnFocus
      maxLength={keyboard === "text" ? 12 : 6}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...type.bodyStrong,
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space(2),
    color: colors.fg,
    textAlign: "center",
  },
});
