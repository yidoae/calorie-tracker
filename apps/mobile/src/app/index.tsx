import { Redirect } from "expo-router";
import { firstUnansweredStep } from "@/hooks/setupSteps";
import { useSession } from "@/hooks/useSession";

/** The anchor route: sends each session state to its first screen; setup resumes where it stopped (FR-006). */
export default function Index() {
  const { status, profile } = useSession();
  if (status === "signedOut") return <Redirect href="/welcome" />;
  if (status === "recovery") return <Redirect href="/reset-password" />;
  if (status === "needsSetup" && profile) {
    return <Redirect href={{ pathname: "/setup/[step]", params: { step: firstUnansweredStep(profile, new Date().getFullYear()) } }} />;
  }
  if (status === "ready") return <Redirect href="/today" />;
  return null;
}
