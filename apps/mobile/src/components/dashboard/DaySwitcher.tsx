import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  /** The day shown, e.g. "24 Ekim Cuma". */
  title: string;
  onPrevious: () => void;
  /** Null on today: there is no later day to show. */
  onNext: (() => void) | null;
}

/** ‹ day › in the band of Bugün (design proposal K4): earlier days without leaving the tab; future days stay closed. */
export default function DaySwitcher({ title, onPrevious, onNext }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Önceki gün" onPress={onPrevious} style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color={colors.onInk} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.title}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sonraki gün"
        accessibilityState={{ disabled: onNext === null }}
        disabled={onNext === null}
        onPress={onNext ?? undefined}
        style={({ pressed }) => [styles.step, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-forward" size={22} color={onNext ? colors.onInk : colors.fgSubtle} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space(2), marginTop: space(1) },
  step: { width: 44, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink2 },
  pressed: { opacity: 0.7 },
  title: { ...type.bodyStrong, color: colors.onInk, flex: 1, textAlign: "center" },
});
