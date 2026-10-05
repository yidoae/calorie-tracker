import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth/AuthScreen";
import { RETURN_PARAM, safeReturnPath } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Kayıt ol · Kalori Takip",
};

/** /kayit-ol: the sign-up page. `?sonra=/plan` brings the visitor back there afterwards; members skip it. */
export default async function RegisterPage({ searchParams }: PageProps<"/kayit-ol">) {
  const returnTo = safeReturnPath((await searchParams)[RETURN_PARAM]);
  if (await getCurrentUser()) redirect(returnTo);
  return <AuthScreen view="register" returnTo={returnTo} />;
}
