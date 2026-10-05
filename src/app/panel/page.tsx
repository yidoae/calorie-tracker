import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import FitBot from "@/components/fitbot/FitBot";
import { requireOnboarded } from "@/server/guards";

export const metadata: Metadata = {
  title: "Panel · Kalori Takip",
};

/** /panel: the dashboard. Guests may look around too; members finish /baslangic first. */
export default async function PanelPage() {
  await requireOnboarded();
  return (
    <>
      <Dashboard />
      <ErrorBoundary title="FitBot yüklenemedi" compact>
        <FitBot />
      </ErrorBoundary>
    </>
  );
}
