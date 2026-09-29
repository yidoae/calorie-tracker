"use client";

import { CalendarDays, LockKeyhole, Moon, Trash2, UserRound, Utensils, Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCalorieGoal } from "@/hooks/useCalorieGoal";
import { useConfirm } from "@/hooks/useConfirm";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useDashboardLayout, type Panel } from "@/hooks/useDashboardLayout";
import { useIsClient } from "@/hooks/useIsClient";
import { useMealActions, useTodayMeals } from "@/hooks/useMeals";
import { LOCALE } from "@/lib/dates";
import ErrorBoundary from "./ErrorBoundary";
import MealCalendar from "./history/MealCalendar";
import SiteHeader from "./layout/SiteHeader";
import MealCapture from "./meals/MealCapture";
import MealTimeline, { MealTimelineSkeleton } from "./meals/MealTimeline";
import QuickEntryBar from "./meals/QuickEntryBar";
import ActivePlanCard from "./profile/ActivePlanCard";
import DailyInsights from "./progress/DailyInsights";
import MacroRings from "./progress/MacroRings";
import TodayHero from "./progress/TodayHero";
import ConfirmDialog from "./ui/ConfirmDialog";
import CustomPlanBadge from "./ui/CustomPlanBadge";
import EmptyState from "./ui/EmptyState";
import Segmented, { type SegmentedItem } from "./ui/Segmented";

const TABS: SegmentedItem<Panel>[] = [
  { id: "calendar", label: "Geçmiş", icon: <CalendarDays aria-hidden className="size-4" /> },
  { id: "today", label: "Bugün", icon: <Utensils aria-hidden className="size-4" /> },
  { id: "profile", label: "Plan", icon: <UserRound aria-hidden className="size-4" /> },
];

/**
 * The whole app screen. This is the composition root: it reads state from hooks and passes plain
 * props down; the components below it don't fetch or hold business rules themselves.
 */
export default function Dashboard() {
  const { status, user, openAuth } = useAuth();
  const profileRef = useRef<HTMLElement>(null);
  const layout = useDashboardLayout(profileRef);
  const { targets, source, dayType, plan } = useCalorieGoal();
  const today = useTodayMeals();
  const actions = useMealActions();
  const progress = useDailyProgress(today.meals, targets, today.loading);
  const clearToday = useConfirm<string[]>();
  const isClient = useIsClient();

  const dateLabel = isClient ? new Date().toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" }) : "Bugün";
  const { panelClass } = layout;

  return (
    <>
      <SiteHeader onOpenProfile={layout.openProfile} />

      <ErrorBoundary title="Günlük özet yüklenemedi" compact>
        <TodayHero
          ring={progress.calorieRing}
          remaining={progress.remaining}
          mealCount={today.meals.length}
          username={user?.username ?? null}
          dateLabel={dateLabel}
        />
      </ErrorBoundary>

      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-24 sm:px-6 lg:pt-12">
          {/* Phone/tablet section switcher; sticks to the top edge while scrolling. */}
          <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-bg px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden">
            <Segmented items={TABS} value={layout.activePanel} onChange={layout.setActivePanel} label="Pano bölümleri" idPrefix="panel" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[18.5rem_minmax(0,1fr)_21rem] lg:items-start">
            <aside id="panel-calendar" aria-label="Takvim ve geçmiş" className={`space-y-4 ${panelClass("calendar")}`}>
              <h2 className="section-title hidden lg:block">Geçmiş</h2>
              <ErrorBoundary title="Geçmiş yüklenemedi">
                <MealCalendar targets={targets} onDelete={actions.remove} onClearDay={actions.clearDay} />
              </ErrorBoundary>
            </aside>

            <div id="panel-today" className={`min-w-0 space-y-8 ${panelClass("today")}`}>
              <ErrorBoundary title="Öğün ekleme yüklenemedi">
                <div className="space-y-4">
                  <MealCapture />
                  <QuickEntryBar />
                </div>
              </ErrorBoundary>

              <ErrorBoundary title="İlerleme yüklenemedi">
                <section aria-labelledby="progress-heading" className="card p-4 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 id="progress-heading" className="section-title">
                      Bugünkü makrolar
                    </h2>
                    {dayType ? (
                      <span className={`badge ${dayType === "training" ? "bg-cta text-cta-fg" : "bg-warning-soft text-warning-text"}`}>
                        {dayType === "training" ? <Zap aria-hidden className="size-3" /> : <Moon aria-hidden className="size-3" />}
                        {dayType === "training" ? "Antrenman günü" : "Dinlenme günü"}
                      </span>
                    ) : (
                      source === "custom" && <CustomPlanBadge />
                    )}
                  </div>
                  <MacroRings rings={progress.macroRings} />
                  {source === "default" && (
                    <p className="mt-6 rounded-[6px] bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                      Varsayılan hedefler gösteriliyor.{" "}
                      <Link href="/plan" className="link">
                        AI planını oluştur
                      </Link>
                      , kişisel hedeflerini gör.
                    </p>
                  )}
                </section>
                <div className="mt-4">
                  <DailyInsights title={progress.summaryTitle} insights={progress.insights} loading={today.loading} />
                </div>
              </ErrorBoundary>

              <section aria-labelledby="timeline-heading">
                <div className="mb-4 flex min-h-8 items-center justify-between">
                  <h2 id="timeline-heading" className="section-title">
                    Bugünkü öğünler
                    {today.meals.length > 0 && <span className="ml-2 text-fg-subtle tabular-nums">{today.meals.length}</span>}
                  </h2>
                  {today.meals.length > 0 && (
                    <button type="button" onClick={() => clearToday.ask(today.meals.map((m) => m.id))} className="btn btn-ghost-danger h-8 px-3 text-xs">
                      <Trash2 aria-hidden className="size-4" /> Günü temizle
                    </button>
                  )}
                </div>
                <ErrorBoundary title="Öğünler yüklenemedi">
                  {status === "guest" ? (
                    <EmptyState
                      icon={<LockKeyhole />}
                      title="Öğünlerini kaydetmek için giriş yap"
                      description="Fotoğraf yükleyip kalorileri hesaplatmak ve günlüğünü tutmak için ücretsiz bir hesap aç."
                      action={
                        <div className="flex flex-wrap justify-center gap-2">
                          <button type="button" onClick={() => openAuth("register")} className="btn btn-primary">
                            Kayıt Ol
                          </button>
                          <button type="button" onClick={() => openAuth("login")} className="btn btn-secondary">
                            Giriş Yap
                          </button>
                        </div>
                      }
                    />
                  ) : today.error ? (
                    <p role="alert" className="alert alert-danger">
                      {today.error}
                    </p>
                  ) : today.loading ? (
                    <MealTimelineSkeleton />
                  ) : (
                    <MealTimeline meals={today.meals} onDelete={actions.remove} />
                  )}
                </ErrorBoundary>
              </section>
            </div>

            <aside
              ref={profileRef}
              id="panel-profile"
              aria-label="Beslenme planı"
              className={`scroll-mt-20 space-y-4 lg:scroll-mt-4 ${panelClass("profile")}`}
            >
              <h2 className="section-title hidden lg:block">Beslenme planı</h2>
              <ErrorBoundary title="Plan yüklenemedi">
                <ActivePlanCard plan={plan} targets={targets} source={source} dayType={dayType} />
              </ErrorBoundary>
            </aside>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={clearToday.open}
        title="Bugünün kaydı temizlensin mi?"
        message={`Bugün kaydedilen ${today.meals.length} öğünün tamamı silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Günü temizle"
        onConfirm={() => clearToday.confirm((ids) => void actions.clearDay(ids))}
        onCancel={clearToday.cancel}
      />
    </>
  );
}
