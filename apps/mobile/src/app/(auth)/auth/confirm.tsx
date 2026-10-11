import { useLocalSearchParams } from "expo-router";
import AuthLink from "@/components/auth/AuthLink";

/** Deep link kaloritakip://auth/confirm?code=… from the sign-up e-mail (FR-002). */
export default function ConfirmLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <AuthLink kind="confirm" code={code} />;
}
