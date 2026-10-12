import { MACRO_LABELS } from "@calorie/core/labels";
import { KCAL_PER_GRAM } from "@calorie/core/nutrition/macros";
import { MACRO_FIELDS, macroRange } from "@calorie/core/nutrition/planTuning";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import { formatKcal } from "@/components/meals/format";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import Segmented from "@/components/ui/Segmented";
import Slider from "@/components/ui/Slider";
import StateMessage from "@/components/ui/StateMessage";
import { useActivePlan } from "@/hooks/useActivePlan";
import { usePlanDraft } from "@/hooks/usePlanDraft";
import { usePlanTuner } from "@/hooks/usePlanTuner";
import { colors, radius, space, type } from "@/theme";
import Field from "./Field";
import MacroSliderRow from "./MacroSliderRow";
import ToggleRow from "./ToggleRow";

const MACRO_COLORS = { protein: colors.macroProtein, carbs: colors.macroCarbs, fat: colors.macroFat } as const;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/plan");
}

/**
 * İnce ayar (US4, FR-009): the plan from the wizard (`fromWizard`) or the active plan, with calorie
 * and macro sliders, "Kalori sabit" and training/rest tabs when it cycles. "Aktif planım yap" saves
 * it through save_plan and returns to the plan tab.
 */
export default function PlanReviewScreen({ fromWizard }: { fromWizard: boolean }) {
  const draft = usePlanDraft();
  const active = useActivePlan();
  const plan = fromWizard ? draft : (active.data ?? null);
  const back = { label: "Geri", onPress: leave };

  if (!fromWizard && active.isPending) {
    return (
      <Screen title="İnce ayar" back={back}>
        <ActivityIndicator accessibilityLabel="Planın yükleniyor" color={colors.fg} style={styles.loading} />
      </Screen>
    );
  }
  if (!fromWizard && active.error) {
    return (
      <Screen title="İnce ayar" back={back}>
        <StateMessage kind="error" title="Planın yüklenemedi" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => void active.refetch()} />
      </Screen>
    );
  }
  if (!plan) {
    return (
      <Screen title="İnce ayar" back={back}>
        <StateMessage kind="empty" title="Ayarlanacak plan yok" body="Önce sihirbazla bir plan oluştur." actionLabel="Plan sihirbazı" onAction={() => router.replace("/plan/wizard")} />
      </Screen>
    );
  }
  // Keyed on the plan so a new wizard plan starts a fresh desk.
  return <TuningDesk key={`${plan.id}-${plan.createdAt}`} plan={plan} isNew={fromWizard} />;
}

function TuningDesk({ plan, isNew }: { plan: NutritionPlan; isNew: boolean }) {
  const t = usePlanTuner(plan);
  const trainingDays = plan.inputs.trainingDays.length;
  const calorieRange = macroRange("calories", plan.inputs.weightKg, t.floor);
  const dayLabel = t.activeDay === "training" ? " · antrenman günü" : t.activeDay === "rest" ? " · dinlenme günü" : "";

  async function onSave() {
    if (await t.save()) router.dismissTo("/plan");
  }

  const footer = (
    <View style={styles.footer}>
      {t.error && <FormError message={t.error.message} />}
      <Button label="Aktif planım yap" loading={t.pending} onPress={() => void onSave()} />
      {t.dirty && <Button label="Önerilene dön" variant="ghost" onPress={t.reset} />}
    </View>
  );

  return (
    <Screen
      title="İnce ayar"
      lead={isNew ? "Önerilen planı kendine göre ayarla, sonra aktif planın yap." : "Aktif planının hedeflerini ayarla."}
      back={{ label: "Geri", onPress: leave }}
      footer={footer}
    >
      <Text style={styles.summary}>{plan.strategySummary}</Text>

      {t.cycling && (
        <Segmented
          label="Gün tipi"
          value={t.activeDay}
          onChange={t.setActiveDay}
          items={[
            { id: "training", label: `Antrenman · ${trainingDays} gün` },
            { id: "rest", label: `Dinlenme · ${7 - trainingDays} gün` },
          ]}
        />
      )}

      <Field label={`Günlük kalori${dayLabel}`} value={`${formatKcal(t.current.calories)} kcal`} hint={`En az ${formatKcal(t.floor)} kcal: güvenli alt sınırın.`}>
        <Slider label={`Günlük kalori${dayLabel}`} value={t.current.calories} {...calorieRange} onChange={t.setCalories} valueText={`${t.current.calories} kilokalori`} />
      </Field>

      <ToggleRow
        label={t.lockCalories ? "Kalori sabit" : "Kalori serbest"}
        description={
          t.lockCalories
            ? "Bir makroyu değiştirince diğer ikisi orantılı dengelenir, toplam kalori değişmez."
            : "Makroları değiştirdikçe toplam kalori kendiliğinden güncellenir."
        }
        value={t.lockCalories}
        onChange={t.setLockCalories}
      />

      {MACRO_FIELDS.map((field) => (
        <MacroSliderRow
          key={field}
          label={MACRO_LABELS[field]}
          grams={t.current[field]}
          range={macroRange(field, plan.inputs.weightKg, t.floor)}
          percentOfCalories={t.current.calories > 0 ? ((t.current[field] * KCAL_PER_GRAM[field]) / t.current.calories) * 100 : 0}
          perKg={field === "carbs" ? undefined : t.perKg(t.current[field])}
          color={MACRO_COLORS[field]}
          onChange={(grams) => t.setMacro(field, grams)}
        />
      ))}

      {/* The energy split of the three macros. */}
      <View style={styles.split} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {MACRO_FIELDS.map((field) => (
          <View
            key={field}
            style={{ flex: t.macroEnergy > 0 ? (t.current[field] * KCAL_PER_GRAM[field]) / t.macroEnergy : 0, backgroundColor: MACRO_COLORS[field] }}
          />
        ))}
      </View>

      {t.cycling && (
        <Text style={styles.average}>
          Haftalık ortalama: {formatKcal(t.weeklyAverage.calories)} kcal · P {t.weeklyAverage.protein} g · K {t.weeklyAverage.carbs} g · Y {t.weeklyAverage.fat} g
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  footer: { gap: space(1) },
  summary: { ...type.body, color: colors.fgMuted },
  split: { flexDirection: "row", height: 12, borderRadius: radius.pill, overflow: "hidden", backgroundColor: colors.surface3 },
  average: { ...type.small, color: colors.fgMuted, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: space(3) },
});
