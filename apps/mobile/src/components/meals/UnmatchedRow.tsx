import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import { colors, radius, space, type } from "@/theme";

interface Props {
  description: string;
  onSearch: () => void;
  onDismiss: () => void;
}

/** Something the AI saw but could not map (003 FR-003): search for the right food or drop it. */
export default function UnmatchedRow({ description, onSearch, onDismiss }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{description}</Text>
      <Button label="Ara" variant="secondary" onPress={onSearch} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${description} listeden çıkar`} hitSlop={11} onPress={onDismiss}>
        <Ionicons name="close" size={22} color={colors.fgMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space(3), borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space(3) },
  text: { ...type.body, color: colors.fg, flex: 1 },
});
