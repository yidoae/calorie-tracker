import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth/AuthScreen";
import { RETURN_PARAM, safeReturnPath } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Giriş yap · Kalori Takip",
};

/** /giris-yap: the sign-in page. `?sonra=/plan` brings the visitor back there afterwards; members skip it. */
export default async function LoginPage({ searchParams }: PageProps<"/giris-yap">) {
  const returnTo = safeReturnPath((await searchParams)[RETURN_PARAM]);
  if (await getCurrentUser()) redirect(returnTo);
  return <AuthScreen view="login" returnTo={returnTo} />;
}
