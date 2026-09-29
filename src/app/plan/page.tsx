import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import PlanBuilder from "@/components/plan/PlanBuilder";

export const metadata: Metadata = {
  title: "Beslenme planı · Kalori Takip",
};

/** /plan: the plan wizard. `?duzenle=1` opens the active plan straight in the tuning desk. */
export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const params = await searchParams;
  return (
    <ErrorBoundary title="Plan ekranı yüklenemedi">
      <PlanBuilder startInReview={params.duzenle === "1"} />
    </ErrorBoundary>
  );
}
