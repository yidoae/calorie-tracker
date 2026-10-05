import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import Onboarding from "@/components/onboarding/Onboarding";
import { authPath, ROUTES } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Başlangıç · Kalori Takip",
};

/** /baslangic: the required first-time setup. Guests sign up first; finished accounts go to the panel. */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect(authPath("register"));
  if (user.onboardingCompleted) redirect(ROUTES.panel);
  return (
    <ErrorBoundary title="Başlangıç ekranı yüklenemedi">
      <Onboarding />
    </ErrorBoundary>
  );
}
