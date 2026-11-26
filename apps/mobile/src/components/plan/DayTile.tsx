import { StyleSheet, Text, View } from "react-native";
import { formatKcal } from "@/components/meals/format";
import { colors, radius, space, type } from "@/theme";

interface Props {
  title: string;
  kcal: number;
  detail: string;
  /** Outlined in lime: the kind of day today is. */
  highlighted?: boolean;
}

/** A training- or rest-day tile: its calories and a line of macros. */
export default function DayTile({ title, kcal, detail, highlighted = false }: Props) {
  return (
    <View style={[styles.tile, highlighted && styles.highlighted]} accessible accessibilityLabel={`${title}: ${formatKcal(kcal)} kilokalori, ${detail}`}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.kcal}>{formatKcal(kcal)} kcal</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Information, not a button: filled, no dark outline (proposal principle 5); the 2 px border is clear until highlighted.
  tile: { flex: 1, minWidth: 0, borderWidth: 2, borderColor: colors.transparent, backgroundColor: colors.surface2, borderRadius: radius.lg, padding: space(3), gap: space(1) },
  highlighted: { borderColor: colors.cta },
  title: { ...type.small, color: colors.fgMuted, fontWeight: "600" },
  kcal: { ...type.displayMd, color: colors.fg },
  detail: { ...type.small, color: colors.fgMuted },
});
