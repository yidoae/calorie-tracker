import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import { colors, radius, space, type } from "@/theme";

interface Props {
  message: string;
  /** A next step that fixes the problem, e.g. sending the confirmation e-mail again. */
  actionLabel?: string;
  onAction?: () => void;
  actionPending?: boolean;
}

/** Why a form could not be sent, under its fields; announced to screen readers. */
export default function FormError({ message, actionLabel, onAction, actionPending }: Props) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.box}>
      <View style={styles.row}>
        <Ionicons name="alert-circle" size={20} color={colors.dangerText} />
        <Text style={styles.text}>{message}</Text>
      </View>
      {actionLabel && onAction && <Button label={actionLabel} variant="secondary" loading={actionPending} onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: space(4), gap: space(3) },
  row: { flexDirection: "row", gap: space(2), alignItems: "flex-start" },
  text: { ...type.body, color: colors.dangerText, flex: 1 },
});
