import type { Macros } from "@calorie/core/schemas/nutrition";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";
import { formatGrams } from "./format";
import MacroLine from "./MacroLine";

interface Props {
  name: string;
  grams: number;
  macros: Macros;
  disabled: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/** A saved item: its grams and nutrition, with "change grams" and "remove" (FR-017). */
export default function MealItemRow({ name, grams, macros, disabled, onEdit, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${formatGrams(grams)} gram`}
        accessibilityHint="Gramını değiştirmek için dokun"
        disabled={disabled}
        onPress={onEdit}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.title}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.grams}>{formatGrams(grams)} g</Text>
        </View>
        <MacroLine macros={macros} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${name} öğünden çıkar`} hitSlop={8} disabled={disabled} onPress={onRemove} style={styles.remove}>
        <Ionicons name="trash-outline" size={22} color={colors.fgMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  main: { flex: 1, padding: space(4), gap: space(1), borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  pressed: { backgroundColor: colors.surface2 },
  title: { flexDirection: "row", justifyContent: "space-between", gap: space(3) },
  name: { ...type.bodyStrong, color: colors.fg, flex: 1 },
  grams: { ...type.bodyStrong, color: colors.fg },
  remove: { paddingHorizontal: space(4), alignSelf: "stretch", justifyContent: "center" },
});
