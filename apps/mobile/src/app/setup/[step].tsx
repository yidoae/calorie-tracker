import { Redirect, useLocalSearchParams } from "expo-router";
import SetupStepScreen from "@/components/setup/SetupStepScreen";
import { firstUnansweredStep, isSetupStep, SETUP_STEPS } from "@/hooks/setupSteps";
import { useProfile } from "@/hooks/useSession";

/**
 * First-time setup (US2). Reachable only while setup is incomplete; answered steps and the first
 * unanswered one open, anything else (a later step, an unknown name) goes to the first unanswered.
 */
export default function SetupStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const profile = useProfile();
  if (!profile) return null;

  const first = firstUnansweredStep(profile, new Date().getFullYear());
  if (!isSetupStep(step) || SETUP_STEPS.indexOf(step) > SETUP_STEPS.indexOf(first)) {
    return <Redirect href={{ pathname: "/setup/[step]", params: { step: first } }} />;
  }
  return <SetupStepScreen key={step} step={step} />;
}
