"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNutritionPlan } from "@/hooks/useNutritionPlan";
import { usePlanBuilder } from "@/hooks/usePlanBuilder";
import { WIZARD_STEPS, usePlanWizard } from "@/hooks/usePlanWizard";
import { ROUTES } from "@/lib/routes";
import type { NutritionPlan } from "@/types/plan";
import type { Profile } from "@/types/profile";
import SiteHeader from "../layout/SiteHeader";
import GeneratingScreen from "./GeneratingScreen";
import LivePreview from "./LivePreview";
import PlanReview from "./PlanReview";
import SensitiveWarningDialog from "./SensitiveWarningDialog";
import StepAdvanced from "./StepAdvanced";
import StepBody from "./StepBody";
import StepDiet from "./StepDiet";
import StepTraining from "./StepTraining";
import WizardProgress from "./WizardProgress";

/** The /plan screen: wizard -> generating -> tuning desk. */
export default function PlanBuilder({ startInReview }: { startInReview: boolean }) {
  const { status } = useAuth();
  const { plan, legacyProfile } = useNutritionPlan();
  const builder = usePlanBuilder(startInReview);
  const { phase } = builder;

  return (
    <>
      <SiteHeader />
      <section className="bg-ink text-on-ink">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pb-16">
          <Link href={ROUTES.panel} className="link inline-flex items-center gap-1 text-xs text-on-ink-muted hover:text-on-ink">
            <ArrowLeft aria-hidden className="size-3" /> Ana ekrana dön
          </Link>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl">
            {phase.kind === "review" ? "Planını ince ayarla" : "AI beslenme planın"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-ink-muted">
            {phase.kind === "review"
              ? "FitBot'un önerisini kaydırıcılarla kendine göre ayarla, sonra aktif planın yap."
              : "4 kısa adımda seni tanıyalım; FitBot metabolizmanı hesaplayıp sana özel bir strateji yazsın."}
          </p>
        </div>
      </section>

      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:pt-10">
          {phase.kind === "generating" ? (
            <GeneratingScreen stepIndex={phase.stepIndex} />
          ) : phase.kind === "review" ? (
            <PlanReview
              key={phase.plan.id}
              plan={phase.plan}
              notice={phase.notice}
              isNew={phase.isNew}
              onActivate={builder.activate}
              onBackToWizard={builder.backToWizard}
            />
          ) : status === "loading" ? (
            <div aria-busy="true" aria-label="Yükleniyor" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="skeleton h-96 rounded-[10px]" />
              <div className="skeleton h-64 rounded-[10px]" />
            </div>
          ) : (
            // Keyed on the saved plan so the wizard starts from its answers once the account loads.
            <Wizard key={plan?.id ?? legacyProfile?.id ?? "new"} previous={plan} legacy={legacyProfile} onGenerate={builder.generate} />
          )}
        </div>
      </main>
    </>
  );
}

function Wizard({
  previous,
  legacy,
  onGenerate,
}: {
  previous: NutritionPlan | null;
  legacy: Profile | null;
  onGenerate: (inputs: NonNullable<ReturnType<typeof usePlanWizard>["inputs"]>) => void;
}) {
  const { settings, updateSettings } = useAuth();
  const w = usePlanWizard(previous?.inputs ?? null, legacy, {
    acknowledged: settings.sensitiveWarningAck,
    onAcknowledge: () => updateSettings((current) => ({ ...current, sensitiveWarningAck: true })),
  });
  const StepComponent = [StepBody, StepTraining, StepDiet, StepAdvanced][w.step];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <SensitiveWarningDialog warning={w.warning} onAccept={w.acceptWarning} onDecline={w.declineWarning} />
      <div className="card min-w-0 overflow-hidden">
        <div className="border-b border-border p-4 sm:px-6">
          <WizardProgress step={w.step} stepValid={w.stepValid} onGoTo={w.goTo} />
        </div>

        <div className="overflow-hidden p-4 sm:p-6">
          <div key={w.step} className={w.direction === "forward" ? "animate-step-forward" : "animate-step-back"}>
            <p className="text-xs font-semibold tracking-[0.05em] text-fg-muted uppercase">
              Adım {w.step + 1} / {WIZARD_STEPS.length}
            </p>
            <h2 className="mt-1 mb-6 font-display text-2xl">{WIZARD_STEPS[w.step].title}</h2>
            <StepComponent w={w} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-2 p-4 sm:px-6">
          <button type="button" onClick={w.back} disabled={w.step === 0} className="btn btn-ghost">
            <ArrowLeft aria-hidden className="size-4" /> Geri
          </button>
          {w.isLast ? (
            <button type="button" disabled={!w.inputs} onClick={() => w.inputs && onGenerate(w.inputs)} className="btn btn-primary btn-lg">
              <Sparkles aria-hidden className="size-4" /> AI planını oluştur
            </button>
          ) : (
            <button type="button" disabled={!w.stepValid[w.step]} onClick={w.next} className="btn btn-primary btn-lg">
              Devam <ArrowRight aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-6">
        <LivePreview preview={w.preview} />
      </div>
    </div>
  );
}
