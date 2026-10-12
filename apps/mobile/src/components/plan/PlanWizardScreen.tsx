import type { PlanInputs } from "@calorie/core/schemas/plan";
import type { Profile } from "@calorie/core/schemas/rows";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useActivePlan } from "@/hooks/useActivePlan";
import { usePlanWizard } from "@/hooks/usePlanWizard";
import { useProfile } from "@/hooks/useSession";
import { colors, space } from "@/theme";
import LivePreview from "./LivePreview";
import SensitiveNotice from "./SensitiveNotice";
import StepAdvanced from "./StepAdvanced";
import StepBody from "./StepBody";
import StepDiet from "./StepDiet";
import StepTraining from "./StepTraining";
import WizardProgress from "./WizardProgress";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/plan");
}

/**
 * Plan sihirbazı (US4, FR-009, FR-010): four steps with a live preview, starting from the active
 * plan's answers. "Planımı oluştur" opens the tuning step with the new plan.
 */
export default function PlanWizardScreen({ initialStep = 0 }: { initialStep?: number }) {
  const plan = useActivePlan();
  const profile = useProfile();

  if (plan.isPending || !profile) {
    return (
      <Screen title="Plan sihirbazı" back={{ label: "Kapat", onPress: leave, icon: "close" }}>
        <ActivityIndicator accessibilityLabel="Planın yükleniyor" color={colors.fg} style={styles.loading} />
      </Screen>
    );
  }
  if (plan.error) {
    return (
      <Screen title="Plan sihirbazı" back={{ label: "Kapat", onPress: leave, icon: "close" }}>
        <StateMessage kind="error" title="Planın yüklenemedi" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => void plan.refetch()} />
      </Screen>
    );
  }
  return <Wizard previous={plan.data?.inputs ?? null} profile={profile} initialStep={initialStep} />;
}

const STEPS = [StepBody, StepTraining, StepDiet, StepAdvanced];

function Wizard({ previous, profile, initialStep }: { previous: PlanInputs | null; profile: Profile; initialStep: number }) {
  const w = usePlanWizard(previous, profile, initialStep);
  const Step = STEPS[w.step];

  function onPrimary() {
    if (!w.isLast) return w.next();
    if (w.generate()) router.push({ pathname: "/plan/review", params: { source: "wizard" } });
  }

  const footer = (
    <View style={styles.footer}>
      <Button label={w.isLast ? "Planımı oluştur" : "Devam"} disabled={w.isLast && !w.inputs} onPress={onPrimary} />
      {w.step > 0 && <Button label="Geri" variant="ghost" onPress={w.back} />}
    </View>
  );

  return (
    <Screen title="Plan sihirbazı" lead="Dört kısa adımda hedeflerini birlikte çıkaralım." back={{ label: "Sihirbazı kapat", onPress: leave, icon: "close" }} footer={footer}>
      <WizardProgress step={w.step} canGoTo={w.canGoTo} onGoTo={w.goTo} />
      <LivePreview preview={w.preview} />
      <Step w={w} />
      <SensitiveNotice warning={w.warning} onAccept={w.acceptWarning} onDecline={w.declineWarning} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  footer: { gap: space(1) },
});
