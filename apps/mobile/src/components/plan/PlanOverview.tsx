import { dayToDate } from "@calorie/core/dates";
import { DIET_STYLE_LABELS, MEAL_PATTERN_LABELS, TRAINING_STYLE_LABELS, WEEKDAY_SHORT } from "@calorie/core/labels";
import { targetsForDate } from "@calorie/core/nutrition/plan";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import PlanTargets from "@/components/setup/PlanTargets";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useActivePlan } from "@/hooks/useActivePlan";
import { useToday } from "@/hooks/useToday";
import { colors, radius, space, type } from "@/theme";
import DayTile from "./DayTile";
import { formatWindow } from "./format";

/** Planım (US4, T054): the active plan's targets, its training/rest days, and the ways to change it. */
export default function PlanOverview() {
  const plan = useActivePlan();
  const { localDate } = useToday();

  const footer = (
    <View style={styles.footer}>
      {plan.data && <Button label="Planı düzenle" onPress={() => router.push("/plan/review")} />}
      <Button label="Yeni plan" variant={plan.data ? "secondary" : "primary"} onPress={() => router.push("/plan/wizard")} />
    </View>
  );

  return (
    <Screen title="Planım" lead="Kalori ve makro hedeflerin." footer={plan.isPending || plan.error ? undefined : footer}>
      {plan.isPending ? (
        <ActivityIndicator accessibilityLabel="Planın yükleniyor" color={colors.fg} style={styles.loading} />
      ) : plan.error ? (
        <StateMessage kind="error" title="Planın yüklenemedi" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => void plan.refetch()} />
      ) : plan.data ? (
        <ActivePlan plan={plan.data} today={dayToDate(localDate)} />
      ) : (
        <StateMessage kind="empty" title="Aktif planın yok" body="Sihirbazla dört kısa adımda planını oluştur." />
      )}
    </Screen>
  );
}

function ActivePlan({ plan, today }: { plan: NutritionPlan; today: Date }) {
  const { inputs, cycle } = plan;
  const { dayType } = targetsForDate(plan, today);
  const days = inputs.trainingDays.length;
  const details: [string, string][] = [
    [
      "Antrenman",
      inputs.trainingStyle === "sedentary"
        ? TRAINING_STYLE_LABELS.sedentary
        : `${TRAINING_STYLE_LABELS[inputs.trainingStyle]} · ${inputs.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ")}`,
    ],
    ["Beslenme", DIET_STYLE_LABELS[inputs.dietStyle]],
    ["Öğün düzeni", inputs.mealPattern === "if168" ? `16:8 · ${formatWindow(inputs.fastingWindowStart)}` : MEAL_PATTERN_LABELS.classic.hint],
  ];

  return (
    <>
      <PlanTargets plan={plan} eyebrow={cycle ? "HAFTALIK ORTALAMAN" : "GÜNLÜK HEDEFİN"} />
      {cycle && (
        <View style={styles.cycle}>
          <Text style={styles.cycleTitle}>KALORİ DÖNGÜSÜ{dayType && ` · BUGÜN ${dayType === "training" ? "ANTRENMAN" : "DİNLENME"} GÜNÜ`}</Text>
          <View style={styles.days}>
            <DayTile
              title={`Antrenman günü · ${days} gün`}
              kcal={cycle.training.calories}
              detail={`P ${cycle.training.protein} · K ${cycle.training.carbs} · Y ${cycle.training.fat} g`}
              highlighted={dayType === "training"}
            />
            <DayTile
              title={`Dinlenme günü · ${7 - days} gün`}
              kcal={cycle.rest.calories}
              detail={`P ${cycle.rest.protein} · K ${cycle.rest.carbs} · Y ${cycle.rest.fat} g`}
              highlighted={dayType === "rest"}
            />
          </View>
        </View>
      )}
      <View style={styles.details}>
        {details.map(([label, value]) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  footer: { gap: space(2) },
  cycle: { gap: space(2) },
  cycleTitle: { ...type.label, color: colors.fgMuted },
  days: { flexDirection: "row", gap: space(3) },
  details: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space(4), gap: space(2) },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: space(4) },
  detailLabel: { ...type.small, color: colors.fgMuted },
  detailValue: { ...type.small, color: colors.fg, fontWeight: "600", flexShrink: 1, textAlign: "right" },
});
