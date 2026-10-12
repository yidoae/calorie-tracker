import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/theme";

interface Props {
  label: string;
  /** The value next to the label, e.g. "−500 kcal/gün". */
  value?: string;
  children: ReactNode;
  /** Why the answer cannot be used yet; replaces the hint and is announced. */
  error?: string | null;
  hint?: string;
  /** For a group of single-choice options. */
  radiogroup?: boolean;
}

/** One question of the wizard or the tuning desk: label (and value), the control, then an error or a hint. */
export default function Field({ label, value, children, error, hint, radiogroup = false }: Props) {
  return (
    <View accessibilityRole={radiogroup ? "radiogroup" : undefined} accessibilityLabel={radiogroup ? label : undefined} style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        {value !== undefined && <Text style={styles.value}>{value}</Text>}
      </View>
      {children}
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
  wrap: { gap: space(2) },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space(2) },
  label: { ...type.small, color: colors.fg, fontWeight: "600", flexShrink: 1 },
  value: { ...type.displayMd, color: colors.fg },
  error: { ...type.small, color: colors.dangerText },
  hint: { ...type.small, color: colors.fgMuted },
});
