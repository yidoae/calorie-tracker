import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "@/theme";

interface Props {
  kind: "success" | "error" | "info";
  title: string;
  body?: string;
  onDismiss: () => void;
}

const ICONS = { success: "checkmark-circle", error: "alert-circle", info: "information-circle" } as const;
const ACCENT = { success: colors.cta, error: colors.danger, info: colors.onInkMuted } as const;

/** A short message pinned to the bottom of the screen; tap to close. */
export default function Toast({ kind, title, body, onDismiss }: Props) {
  return (
    <SafeAreaView edges={["bottom"]} pointerEvents="box-none" style={styles.layer}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityHint="Kapatmak için dokun"
        onPress={onDismiss}
        style={styles.toast}
      >
        <Ionicons name={ICONS[kind]} size={22} color={ACCENT[kind]} />
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {body && <Text style={styles.body}>{body}</Text>}
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space(4), paddingBottom: space(4) },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space(3),
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space(4),
  },
  text: { flex: 1, gap: space(0.5) },
  title: { ...type.bodyStrong, color: colors.onInk },
  body: { ...type.small, color: colors.onInkMuted },
});
