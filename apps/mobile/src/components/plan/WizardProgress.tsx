import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WIZARD_STEPS } from "@/hooks/planWizardLogic";
import { colors, radius, space, type } from "@/theme";

interface Props {
  step: number;
  canGoTo: (step: number) => boolean;
  onGoTo: (step: number) => void;
}

/** "ADIM 2 / 4" and one numbered pill per step; finished steps can be revisited. */
export default function WizardProgress({ step, canGoTo, onGoTo }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        ADIM {step + 1} / {WIZARD_STEPS.length} · {WIZARD_STEPS[step].title.toLocaleUpperCase("tr-TR")}
      </Text>
      <View style={styles.pills}>
        {WIZARD_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = canGoTo(i);
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`Adım ${i + 1}: ${s.title}`}
              accessibilityState={{ selected: current, disabled: !reachable }}
              disabled={!reachable || current}
              onPress={() => onGoTo(i)}
              style={styles.target}
            >
              <View style={[styles.pill, current && styles.current, done && styles.done]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color={colors.ctaFg} />
                ) : (
                  <Text style={[styles.number, current && styles.currentNumber]}>{i + 1}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  label: { ...type.label, color: colors.fgMuted },
  pills: { flexDirection: "row", justifyContent: "space-between" },
  target: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  pill: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  current: { backgroundColor: colors.ink, borderColor: colors.ink },
  done: { backgroundColor: colors.cta, borderColor: colors.cta },
  number: { ...type.bodyStrong, fontSize: 13, color: colors.fgSubtle },
  currentNumber: { color: colors.cta },
});
