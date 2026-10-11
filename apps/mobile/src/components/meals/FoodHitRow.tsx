import type { FoodHit } from "@calorie/core/schemas/rows";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";
import { formatGrams, formatKcal } from "./format";

interface Props {
  hit: FoodHit;
  onPress: () => void;
}

/** One search result: the food, the alias that matched when it differs, kcal per 100 g and the usual portion. */
export default function FoodHitRow({ hit, onPress }: Props) {
  const alias = hit.matchedAlias.toLocaleLowerCase("tr-TR") === hit.name.toLocaleLowerCase("tr-TR") ? null : hit.matchedAlias;
  const detail = `100 g: ${formatKcal(hit.per100g.calories)} kcal · porsiyon ~${formatGrams(hit.typicalPortionG)} g`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${hit.name}, ${detail}`}
      accessibilityHint="Gramını yazmak için seç"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.name}>{hit.name}</Text>
        {alias && <Text style={styles.alias}>“{alias}”</Text>}
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={26} color={colors.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surface2 },
  text: { flex: 1, gap: space(0.5) },
  name: { ...type.bodyStrong, color: colors.fg },
  alias: { ...type.small, color: colors.fgMuted },
  detail: { ...type.small, color: colors.fgMuted },
});
