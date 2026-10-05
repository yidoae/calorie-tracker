import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "@/components/landing/Landing";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Kalori Takip · Şampiyonlar ne yediğini bilir",
};

/** /giris: the landing page for guests; members are sent to their panel. */
export default async function LandingPage() {
  if (await getCurrentUser()) redirect(ROUTES.panel);
  return (
    <ErrorBoundary title="Sayfa yüklenemedi">
      <Landing />
    </ErrorBoundary>
  );
}
