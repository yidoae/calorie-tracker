import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "onInk";

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses while an action runs (FR-022). */
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading icon (e.g. a provider logo). */
  icon?: ReactNode;
  accessibilityHint?: string;
  /** Stable id for the Maestro smoke flow (.maestro/smoke.yaml). */
  testID?: string;
}

/** Lime is the one primary action per screen; disabled states use muted colours, not opacity. */
export default function Button({ label, onPress, variant = "primary", loading = false, disabled = false, icon, accessibilityHint, testID }: Props) {
  const inactive = disabled || loading;
  const palette = inactive ? PALETTE.disabled : PALETTE[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? palette.pressed : palette.bg, borderColor: palette.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const PALETTE = {
  primary: { bg: colors.cta, pressed: colors.ctaPressed, fg: colors.ctaFg, border: colors.cta },
  secondary: { bg: colors.surface, pressed: colors.surface2, fg: colors.fg, border: colors.borderStrong },
  ghost: { bg: colors.transparent, pressed: colors.surface2, fg: colors.fg, border: colors.transparent },
  onInk: { bg: colors.ink2, pressed: colors.ink, fg: colors.onInk, border: colors.onInkMuted },
  disabled: { bg: colors.surface3, pressed: colors.surface3, fg: colors.fgSubtle, border: colors.surface3 },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space(5),
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space(2) },
  label: { ...type.bodyStrong, fontSize: 16 },
});
