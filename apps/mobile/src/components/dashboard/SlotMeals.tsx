import { SLOT_LABELS } from "@calorie/core/labels";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatKcal } from "@/components/meals/format";
import type { SlotGroup } from "@/hooks/mealLogic";
import { colors, radius, space, type } from "@/theme";

interface Props {
  group: SlotGroup;
  onOpen: (mealId: string) => void;
  /** Bugün only: a "+" that adds a meal to this slot; `primary` makes it the screen's lime action. */
  add?: { onPress: () => void; primary: boolean };
}

/** One slot of the day (Kahvaltı, Öğle yemeği, …) with its meals; a meal opens its detail. An empty slot shows only on Bugün, with its "+". */
export default function SlotMeals({ group, onOpen, add }: Props) {
  const label = SLOT_LABELS[group.slot];
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>
          {label}
        </Text>
        <Text style={styles.kcal}>{group.meals.length > 0 ? `${formatKcal(group.calories)} kcal` : ""}</Text>
        {add && (
          <Pressable
            testID={`today-add-${group.slot}`}
            accessibilityRole="button"
            accessibilityLabel={`${label} ekle`}
            onPress={add.onPress}
            style={({ pressed }) => [styles.add, add.primary && styles.addPrimary, pressed && styles.addPressed]}
          >
            <Ionicons name="add" size={22} color={colors.fg} />
          </Pressable>
        )}
      </View>
      {group.meals.length === 0 && <Text style={styles.empty}>Henüz öğün yok.</Text>}
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
  head: { flexDirection: "row", alignItems: "center", gap: space(3) },
  title: { ...type.displayMd, color: colors.fg, flex: 1 },
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
  add: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  addPrimary: { backgroundColor: colors.cta, borderColor: colors.cta },
  addPressed: { backgroundColor: colors.ctaPressed },
  empty: { ...type.small, color: colors.fgMuted },
  mealText: { flex: 1, gap: space(0.5) },
  name: { ...type.bodyStrong, color: colors.fg },
  detail: { ...type.small, color: colors.fgMuted },
});
