import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import TrendsView from "@/components/trends/TrendsView";
import { requireOnboarded } from "@/server/guards";

export const metadata: Metadata = {
  title: "Gelişim & Analiz · Kalori Takip",
  description: "Serilerin, hedefe göre kalorilerin ve makro ortalamaların.",
};

/** /gelisim ("Gelişim & Analiz", formerly /trendler): streaks, calories against the goal line and averages. */
export default async function ProgressPage() {
  await requireOnboarded();
  return (
    <ErrorBoundary title="Gelişim & Analiz yüklenemedi">
      <TrendsView />
    </ErrorBoundary>
  );
}
