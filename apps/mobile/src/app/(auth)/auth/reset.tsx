import { useLocalSearchParams } from "expo-router";
import AuthLink from "@/components/auth/AuthLink";

/** Deep link kaloritakip://auth/reset?code=… from the password-reset e-mail (FR-003). */
export default function ResetLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <AuthLink kind="reset" code={code} />;
}
