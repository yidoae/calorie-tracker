import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface SegmentedItem<T extends string | number> {
  id: T;
  label: string;
  /** Spoken instead of the label when it needs more words (e.g. "4 gün" → "Haftada 4 gün"). */
  accessibilityLabel?: string;
}

interface Props<T extends string | number> {
  items: SegmentedItem<T>[];
  /** Null when nothing is picked yet. */
  value: T | null;
  onChange: (id: T) => void;
  /** Names the group for screen readers. */
  label: string;
  disabled?: boolean;
}

/** A dumb segmented control with tab semantics: one of a few options, each a 44 pt target. */
export default function Segmented<T extends string | number>({ items, value, onChange, label, disabled = false }: Props<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.group}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={String(item.id)}
            accessibilityRole="tab"
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(item.id)}
            style={[styles.item, selected && !disabled && styles.selected]}
          >
            <Text numberOfLines={1} style={[styles.label, selected && !disabled && styles.selectedLabel, disabled && styles.disabledLabel]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    gap: space(1),
    padding: space(1),
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  item: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingHorizontal: space(2) },
  selected: { backgroundColor: colors.ink },
  label: { ...type.bodyStrong, fontSize: 14, color: colors.fgMuted },
  selectedLabel: { color: colors.onInk },
  disabledLabel: { color: colors.fgSubtle },
});
