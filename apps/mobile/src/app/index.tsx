import { Redirect } from "expo-router";
import { useSession } from "@/hooks/useSession";

/** The anchor route: sends each session state to its first screen. */
export default function Index() {
  const { status } = useSession();
  if (status === "signedOut") return <Redirect href="/welcome" />;
  if (status === "recovery") return <Redirect href="/reset-password" />;
  if (status === "needsSetup") return <Redirect href="/setup/body" />;
  if (status === "ready") return <Redirect href="/today" />;
  return null;
}
