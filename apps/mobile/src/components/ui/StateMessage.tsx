import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/theme";
import Button from "./Button";

interface Props {
  kind: "empty" | "error";
  title: string;
  body?: string;
  /** For errors: what to try again; for empty states: the first thing to do. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Empty and error states: a calm icon, one sentence on what happened, one next step (FR-022). */
export default function StateMessage({ kind, title, body, actionLabel, onAction }: Props) {
  return (
    <View accessibilityRole={kind === "error" ? "alert" : undefined} style={styles.wrap}>
      <View style={[styles.icon, kind === "error" ? styles.iconError : styles.iconEmpty]}>
        <Ionicons name={kind === "error" ? "cloud-offline-outline" : "restaurant-outline"} size={28} color={kind === "error" ? colors.dangerText : colors.fgMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant={kind === "error" ? "secondary" : "primary"} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: space(8), paddingHorizontal: space(4), gap: space(2) },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: space(2) },
  iconEmpty: { backgroundColor: colors.surface2 },
  iconError: { backgroundColor: colors.dangerSoft },
  title: { ...type.displayMd, color: colors.fg, textAlign: "center" },
  body: { ...type.body, color: colors.fgMuted, textAlign: "center", maxWidth: 300 },
  action: { marginTop: space(3), alignSelf: "stretch" },
});
