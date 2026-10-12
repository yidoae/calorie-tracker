import type { Macros } from "@calorie/core/schemas/nutrition";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TextField from "@/components/ui/TextField";
import { colors, radius, space, type } from "@/theme";
import { formatGrams } from "./format";
import MacroLine from "./MacroLine";

interface Props {
  name: string;
  typicalPortionG: number;
  gramsText: string;
  onChangeGrams: (text: string) => void;
  /** Nutrition at the typed grams; null while they are not valid. */
  macros: Macros | null;
  error: string | null;
  onRemove: () => void;
}

/** One food of the meal under review: an empty gram field the user must fill (FR-013) and its live nutrition. */
export default function DraftItemCard({ name, typicalPortionG, gramsText, onChangeGrams, macros, error, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${name} öğünden çıkar`} hitSlop={11} onPress={onRemove}>
          <Ionicons name="trash-outline" size={22} color={colors.fgMuted} />
        </Pressable>
      </View>
      <TextField
        testID="draft-grams"
        label="Kaç gram yedin?"
        value={gramsText}
        onChangeText={onChangeGrams}
        placeholder="Gram"
        unit="g"
        keyboardType="decimal-pad"
        hint={`Tipik porsiyon yaklaşık ${formatGrams(typicalPortionG)} g; tarttığın ya da tahmin ettiğin miktarı yaz.`}
        error={error}
      />
      {macros ? <MacroLine macros={macros} /> : <Text style={styles.pending}>Gramı yazınca kalori ve makrolar görünür.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(3) },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space(3) },
  name: { ...type.bodyStrong, color: colors.fg, flex: 1 },
  pending: { ...type.small, color: colors.fgMuted },
});
