import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import PlanBuilder from "@/components/plan/PlanBuilder";
import { requireOnboarded } from "@/server/guards";

export const metadata: Metadata = {
  title: "Beslenme planı · Kalori Takip",
};

/**
 * /plan: the plan wizard. `?duzenle=1` opens the main plan straight in the tuning desk
 * (`&donem=<id>`: that period's plan instead); `?yeni=1` builds a plan for a new dated period.
 */
export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  await requireOnboarded();
  const params = await searchParams;
  return (
    <ErrorBoundary title="Plan ekranı yüklenemedi">
      <PlanBuilder
        startInReview={params.duzenle === "1"}
        target={params.yeni === "1" ? { kind: "newPeriod" } : typeof params.donem === "string" ? { kind: "period", id: params.donem } : { kind: "main" }}
      />
    </ErrorBoundary>
  );
}
