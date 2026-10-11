import { MACRO_LABELS } from "@calorie/core/labels";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MacroBar from "@/components/ui/MacroBar";
import Ring from "@/components/ui/Ring";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useTargets } from "@/hooks/useTargets";
import { colors, radius, space, type } from "@/theme";

const MACROS = [
  { key: "protein", color: colors.macroProtein },
  { key: "carbs", color: colors.macroCarbs },
  { key: "fat", color: colors.macroFat },
] as const;

const DAY_TYPE = { training: "Antrenman günü", rest: "Dinlenme günü" } as const;

/**
 * Today: the day's targets from the active plan as a calorie ring and macro bars (US2, T038).
 * Nothing is eaten yet: meals and the add button arrive with meal logging (US3).
 */
export default function Today() {
  const { resolved, loading, error, retry } = useTargets();

  return (
    <Screen title="Bugün" lead="Günlük hedeflerin ve öğünlerin.">
      {loading ? (
        <ActivityIndicator accessibilityLabel="Hedeflerin yükleniyor" color={colors.fg} style={styles.loading} />
      ) : error || !resolved ? (
        <StateMessage kind="error" title="Hedeflerin yüklenemedi" body={error?.message} actionLabel="Tekrar dene" onAction={retry} />
      ) : (
        <>
          <View style={styles.ring}>
            <Ring value={0} target={resolved.targets.calories} />
            {resolved.dayType && <Text style={styles.dayType}>{DAY_TYPE[resolved.dayType]}</Text>}
          </View>
          <View style={styles.card}>
            {MACROS.map(({ key, color }) => (
              <MacroBar key={key} label={MACRO_LABELS[key]} value={0} target={resolved.targets[key]} color={color} />
            ))}
          </View>
          <StateMessage kind="empty" title="Henüz öğün yok" body="Yediğin öğünler burada listelenecek ve halkayı dolduracak." />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  ring: { alignItems: "center", gap: space(2), paddingVertical: space(2) },
  dayType: { ...type.label, color: colors.fgMuted },
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(4) },
});
