import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme";

interface Props {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}

/** An icon-only 44 pt button (remove a set, an exercise or a day). */
export default function IconButton({ icon, label, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={4} onPress={onPress} style={styles.button}>
      <Ionicons name={icon} size={20} color={colors.fgMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
