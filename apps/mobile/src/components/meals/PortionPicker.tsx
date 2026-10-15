import { Pressable, StyleSheet, Text, View } from "react-native";
import { canStep, type Portion, type PortionPick } from "@/hooks/portionLogic";
import { colors, radius, space, type } from "@/theme";
import { formatGrams } from "./format";

interface Props {
  portions: Portion[];
  /** The chosen unit and count; null while the user types grams. */
  pick: PortionPick | null;
  onPick: (unit: string) => void;
  onStep: (delta: 1 | -1) => void;
}

/**
 * Portion shortcuts under the gram field (002 US2, contracts/screens.md): unit chips, then a −/+
 * count for the chosen unit. They only fill the gram field; the user still sees and edits it.
 */
export default function PortionPicker({ portions, pick, onPick, onStep }: Props) {
  return (
    <View style={styles.wrap}>
      <View accessibilityRole="radiogroup" accessibilityLabel="Porsiyon" style={styles.chips}>
        {portions.map((p) => {
          const selected = pick?.unit === p.unit;
          return (
            <Pressable
              key={p.unit}
              testID={`portion-${p.unit}`}
              accessibilityRole="radio"
              accessibilityLabel={`1 ${p.unit}, ${formatGrams(p.grams)} gram`}
              accessibilityState={{ checked: selected }}
              onPress={() => onPick(p.unit)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{p.unit}</Text>
            </Pressable>
          );
        })}
      </View>
      {pick && (
        <View style={styles.stepper}>
          <StepButton label="Bir azalt" symbol="−" disabled={!canStep(portions, pick, -1)} onPress={() => onStep(-1)} />
          <Text accessibilityLiveRegion="polite" style={styles.count}>
            {pick.count} {pick.unit}
          </Text>
          <StepButton label="Bir artır" symbol="+" disabled={!canStep(portions, pick, 1)} onPress={() => onStep(1)} />
        </View>
      )}
    </View>
  );
}

function StepButton({ label, symbol, disabled, onPress }: { label: string; symbol: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, disabled && styles.stepDisabled]}
    >
      <Text style={[styles.stepSymbol, disabled && styles.stepSymbolDisabled]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space(2) },
  chip: { minHeight: 44, minWidth: 44, paddingHorizontal: space(3), justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { ...type.bodyStrong, fontSize: 14, color: colors.fg },
  chipLabelSelected: { color: colors.onInk },
  stepper: { flexDirection: "row", alignItems: "center", gap: space(3) },
  step: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md },
  stepDisabled: { borderColor: colors.border },
  stepSymbol: { ...type.displayMd, color: colors.fg },
  stepSymbolDisabled: { color: colors.fgSubtle },
  count: { ...type.bodyStrong, color: colors.fg, minWidth: 72, textAlign: "center" },
});
