import { StyleSheet, Text, View } from "react-native";
import { formatKcal } from "@/components/meals/format";
import type { WizardPreview } from "@/hooks/planWizardLogic";
import { colors, radius, space, type } from "@/theme";
import { formatWeeklyChange } from "./format";

/** The wizard's live numbers (US4 scenario 1): they follow every answer at once. */
export default function LivePreview({ preview }: { preview: WizardPreview | null }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.card}>
      <Text style={styles.eyebrow}>CANLI ÖNİZLEME</Text>
      {!preview ? (
        <Text style={styles.empty}>Boy, kilo ve yaşın tamam olunca günlük hedefin burada anında görünür.</Text>
      ) : (
        <>
          <Text style={styles.kcal} accessibilityLabel={`Günlük hedef ${formatKcal(preview.base.calories)} kilokalori`}>
            {formatKcal(preview.base.calories)} kcal
          </Text>
          <Text style={styles.line}>
            P {preview.base.protein} g · K {preview.base.carbs} g · Y {preview.base.fat} g · Haftalık {formatWeeklyChange(preview.weeklyChange)}
          </Text>
          {preview.cycle && (
            <Text style={styles.line}>
              Antrenman günü {formatKcal(preview.cycle.training.calories)} kcal · Dinlenme günü {formatKcal(preview.cycle.rest.calories)} kcal
            </Text>
          )}
          {preview.weeksToGoal !== null && <Text style={styles.goal}>Bu tempoyla hedef kilona yaklaşık {preview.weeksToGoal} haftada ulaşırsın.</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space(4), gap: space(1) },
  eyebrow: { ...type.label, color: colors.cta },
  empty: { ...type.small, color: colors.onInkMuted },
  kcal: { ...type.displayLg, color: colors.onInk },
  line: { ...type.small, color: colors.onInkMuted },
  goal: { ...type.small, color: colors.onInk, marginTop: space(1) },
});
