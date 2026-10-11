import { ACTIVITY_LEVEL_KEYS, GENDERS, type Gender } from "@calorie/core/schemas/profile";
import { ACTIVITY_LEVEL_LABELS, DIET_STYLE_HINTS, DIET_STYLE_LABELS } from "@calorie/core/labels";
import { DIET_STYLES } from "@calorie/core/schemas/plan";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import TextField from "@/components/ui/TextField";
import { SETUP_STEPS, stepAfter, stepBefore, type SetupStep } from "@/hooks/setupSteps";
import { useOnboarding } from "@/hooks/useOnboarding";
import { colors, space, type } from "@/theme";
import ChoiceCard from "./ChoiceCard";
import PlanTargets from "./PlanTargets";
import SetupProgress from "./SetupProgress";

const COPY: Record<SetupStep, { title: string; lead: string }> = {
  basics: { title: "Cinsiyet ve yaş", lead: "Kalori ihtiyacın ve güvenli alt sınırın bunlara göre hesaplanır." },
  body: { title: "Boy ve kilo", lead: "Bugünkü ölçülerini yaz." },
  goal: { title: "Hedef kilo", lead: "Ulaşmak istediğin kilo. Bugünkü kilonla aynıysa formunu koruruz." },
  activity: { title: "Hareket", lead: "Bir haftan genelde nasıl geçiyor?" },
  diet: { title: "Beslenme tarzı", lead: "Makroların buna göre dağıtılır; sonra değiştirebilirsin." },
  summary: { title: "Özet", lead: "Günlük hedeflerin hazır. Bir cevabı değiştirmek için geri dön." },
};

const SEX_LABELS: Record<Gender, string> = { female: "Kadın", male: "Erkek" };

const to = (step: SetupStep) => ({ pathname: "/setup/[step]", params: { step } }) as const;

/** One step of the first-time setup (US2, contracts/screens.md); every answer is saved before the next step. */
export default function SetupStepScreen({ step }: { step: SetupStep }) {
  const s = useOnboarding(step);
  const next = stepAfter(step);
  const previous = stepBefore(step);

  async function onContinue() {
    if (step === "summary") return s.finish();
    if (next && (await s.saveStep())) router.push(to(next));
  }

  function onBack() {
    if (!previous) return;
    if (router.canGoBack()) router.back();
    else router.replace(to(previous));
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        label={step === "summary" ? "Planımı oluştur" : "Devam"}
        loading={s.pending}
        disabled={step === "summary" && !s.plan}
        onPress={() => void onContinue()}
      />
      {previous && <Button label="Geri" variant="ghost" onPress={onBack} />}
    </View>
  );

  return (
    <Screen title={COPY[step].title} lead={COPY[step].lead} footer={footer}>
      <SetupProgress current={SETUP_STEPS.indexOf(step) + 1} total={SETUP_STEPS.length} />

      {step === "basics" && (
        <>
          <Question label="Cinsiyet" error={s.errors.sex}>
            {GENDERS.map((sex) => (
              <ChoiceCard key={sex} title={SEX_LABELS[sex]} selected={s.draft.sex === sex} onPress={() => s.setField("sex", sex)} />
            ))}
          </Question>
          <TextField label="Yaş" value={s.draft.age} onChangeText={(t) => s.setField("age", t)} keyboardType="number-pad" unit="yaş" error={s.errors.age} />
        </>
      )}

      {step === "body" && (
        <>
          <TextField label="Boy" value={s.draft.heightCm} onChangeText={(t) => s.setField("heightCm", t)} keyboardType="decimal-pad" unit="cm" error={s.errors.heightCm} />
          <TextField label="Kilo" value={s.draft.weightKg} onChangeText={(t) => s.setField("weightKg", t)} keyboardType="decimal-pad" unit="kg" error={s.errors.weightKg} />
        </>
      )}

      {step === "goal" && (
        <TextField
          label="Hedef kilo"
          value={s.draft.targetWeightKg}
          onChangeText={(t) => s.setField("targetWeightKg", t)}
          keyboardType="decimal-pad"
          unit="kg"
          error={s.errors.targetWeightKg}
          hint={s.goal ? `Planın: ${s.goal.title} (${s.goal.hint.toLocaleLowerCase("tr-TR")})` : undefined}
        />
      )}

      {step === "activity" && (
        <Question label="Hareket düzeyin" error={s.errors.activity}>
          {ACTIVITY_LEVEL_KEYS.map((level) => (
            <ChoiceCard
              key={level}
              title={ACTIVITY_LEVEL_LABELS[level].title}
              hint={ACTIVITY_LEVEL_LABELS[level].hint}
              selected={s.draft.activity === level}
              onPress={() => s.setField("activity", level)}
            />
          ))}
        </Question>
      )}

      {step === "diet" && (
        <Question label="Beslenme tarzın" error={s.errors.dietStyle}>
          {DIET_STYLES.map((style) => (
            <ChoiceCard
              key={style}
              title={DIET_STYLE_LABELS[style]}
              hint={DIET_STYLE_HINTS[style]}
              selected={s.draft.dietStyle === style}
              onPress={() => s.setField("dietStyle", style)}
            />
          ))}
        </Question>
      )}

      {step === "summary" &&
        (s.plan ? (
          <PlanTargets plan={s.plan} />
        ) : (
          <StateMessage kind="error" title="Bir cevap eksik" body="Geri dönüp tüm adımları tamamla." />
        ))}

      {s.formError && <FormError message={s.formError.message} />}
    </Screen>
  );
}

/** A single-choice question: its options, then why it cannot be saved yet. */
function Question({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.question}>
      <Text style={styles.questionLabel}>{label}</Text>
      {children}
      {error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space(1) },
  question: { gap: space(2) },
  questionLabel: { ...type.small, color: colors.fg, fontWeight: "600" },
  error: { ...type.small, color: colors.dangerText },
});
