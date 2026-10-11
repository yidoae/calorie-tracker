import { SLOT_LABELS } from "@calorie/core/labels";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatKcal } from "@/components/meals/format";
import type { SlotGroup } from "@/hooks/mealLogic";
import { colors, radius, space, type } from "@/theme";

interface Props {
  group: SlotGroup;
  onOpen: (mealId: string) => void;
}

/** One slot of the day (Kahvaltı, Öğle yemeği, …) with its meals; a meal opens its detail. */
export default function SlotMeals({ group, onOpen }: Props) {
  const label = SLOT_LABELS[group.slot];
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>
          {label}
        </Text>
        <Text style={styles.kcal}>{formatKcal(group.calories)} kcal</Text>
      </View>
      {group.meals.map((meal) => (
        <Pressable
          key={meal.id}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${meal.name}, ${formatKcal(meal.totals.calories)} kilokalori`}
          accessibilityHint="Öğünü açmak için dokun"
          onPress={() => onOpen(meal.id)}
          style={({ pressed }) => [styles.meal, pressed && styles.pressed]}
        >
          <View style={styles.mealText}>
            <Text style={styles.name} numberOfLines={2}>
              {meal.name}
            </Text>
            <Text style={styles.detail}>
              {meal.items.length} yemek · {formatKcal(meal.totals.calories)} kcal
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.fgMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space(2) },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { ...type.displayMd, color: colors.fg },
  kcal: { ...type.bodyStrong, color: colors.fgMuted },
  meal: {
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
  mealText: { flex: 1, gap: space(0.5) },
  name: { ...type.bodyStrong, color: colors.fg },
  detail: { ...type.small, color: colors.fgMuted },
});
