"use client";

import {
  CalendarDays,
  LineChart,
  Moon,
  UserRound,
  Utensils,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCalorieGoal } from "@/hooks/useCalorieGoal";
import { useConfirm } from "@/hooks/useConfirm";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useDashboardLayout, type Panel } from "@/hooks/useDashboardLayout";
import { useFasting } from "@/hooks/useFasting";
import { useIsClient } from "@/hooks/useIsClient";
import { useMealEdit } from "@/hooks/useMealEdit";
import { useMealActions, useTodayMeals } from "@/hooks/useMeals";
import { useQuickAdd } from "@/hooks/useQuickAdd";
import { useWater } from "@/hooks/useWater";
import { useWeekSeries } from "@/hooks/useWeekSeries";
import { useWeightLog } from "@/hooks/useWeightLog";
import { ROUTES } from "@/lib/routes";
import type { MealSlot } from "@/types/meal";
import DashboardIntro from "./dashboard/DashboardIntro";
import EnergyCard from "./dashboard/EnergyCard";
import MealsCard from "./dashboard/MealsCard";
import QuickAddCard from "./dashboard/QuickAddCard";
import WeekCard from "./dashboard/WeekCard";
import ErrorBoundary from "./ErrorBoundary";
import FastingCard from "./fasting/FastingCard";
import MealCalendar from "./history/MealCalendar";
import SiteHeader from "./layout/SiteHeader";
import MealCapture from "./meals/MealCapture";
import MealEditDialog from "./meals/MealEditDialog";
import QuickEntryBar from "./meals/QuickEntryBar";
import QuickPicks from "./meals/QuickPicks";
import ActivePlanCard from "./profile/ActivePlanCard";
import WeightCard from "./profile/WeightCard";
import DailyInsights from "./progress/DailyInsights";
import MicroPanel from "./progress/MicroPanel";
import WaterCard from "./progress/WaterCard";
import ConfirmDialog from "./ui/ConfirmDialog";
import CustomPlanBadge from "./ui/CustomPlanBadge";
import { cardEnter } from "./ui/motion";
import Segmented, { type SegmentedItem } from "./ui/Segmented";

const TABS: SegmentedItem<Panel>[] = [
  {
    id: "calendar",
    label: "Geçmiş",
    icon: <CalendarDays aria-hidden className="size-4" />,
  },
  {
    id: "today",
    label: "Bugün",
    icon: <Utensils aria-hidden className="size-4" />,
  },
  {
    id: "profile",
    label: "Plan",
    icon: <UserRound aria-hidden className="size-4" />,
  },
];

/**
 * The whole app screen. This is the composition root: it reads state from hooks and passes plain
 * props down; the components below it don't fetch or hold business rules themselves.
 *
 * Layout: energy ring · the day's meals · water + quick add on the first row (two columns on
 * tablets, three from xl), the week chart + micronutrients below, then history and the plan.
 * On phones the sections are tabs (Geçmiş / Bugün / Plan).
 */
export default function Dashboard() {
  const { status, user, openAuth } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const layout = useDashboardLayout(profileRef);
  const { targets, source, dayType, plan } = useCalorieGoal();
  const today = useTodayMeals();
  const actions = useMealActions();
  const progress = useDailyProgress(
    today.meals,
    targets,
    today.loading,
    plan?.inputs.mealPattern ?? "classic",
  );
  const clearToday = useConfirm<string[]>();
  const edit = useMealEdit();
  const water = useWater();
  const fasting = useFasting();
  const weight = useWeightLog();
  const quick = useQuickAdd();
  const week = useWeekSeries();
  const isClient = useIsClient();
  const { panelClass } = layout;

  const badge = dayType ? (
    <span
      className={`badge ${dayType === "training" ? "bg-cta text-cta-fg" : "bg-warning-soft text-warning-text"}`}
    >
      {dayType === "training" ? (
        <Zap aria-hidden className="size-3" />
      ) : (
        <Moon aria-hidden className="size-3" />
      )}
      {dayType === "training" ? "Antrenman günü" : "Dinlenme günü"}
    </span>
  ) : source === "custom" ? (
    <CustomPlanBadge />
  ) : undefined;

  const pickSlot = (slot: MealSlot) => {
    quick.pick(slot);
    requestAnimationFrame(() =>
      quickRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  return (
    <>
      <SiteHeader onOpenProfile={layout.openProfile} />
      <DashboardIntro
        username={user?.username ?? null}
        goalKcal={targets.calories}
        ready={isClient}
      />

      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <div className="mx-auto w-full max-w-7xl space-y-5 px-4 pt-4 pb-24 sm:px-6 lg:pt-10">
          {/* Phone/tablet section switcher; sticks to the top edge while scrolling. */}
          <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-bg px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden">
            <Segmented
              items={TABS}
              value={layout.activePanel}
              onChange={layout.setActivePanel}
              label="Pano bölümleri"
              idPrefix="panel"
            />
          </div>

          {/* panelClass toggles display, so it sits on a wrapper and never fights the grid. */}
          <div id="panel-today" className={panelClass("today")}>
            <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[20rem_minmax(0,1fr)_21rem]">
              <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
                <ErrorBoundary title="Günlük enerji yüklenemedi">
                  <EnergyCard
                    index={0}
                    calories={progress.calorieRing}
                    macros={progress.macroRings}
                    badge={badge}
                    defaultTargets={source === "default"}
                  />
                </ErrorBoundary>
                <ErrorBoundary title="Özet yüklenemedi">
                  <motion.div {...cardEnter(4)}>
                    <DailyInsights
                      title={progress.summaryTitle}
                      insights={progress.insights}
                      loading={today.loading}
                    />
                  </motion.div>
                </ErrorBoundary>
              </div>

              <div className="min-w-0 space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 xl:row-span-1">
                <ErrorBoundary title="Öğün ekleme yüklenemedi">
                  <motion.div {...cardEnter(1)} className="space-y-4">
                    <MealCapture />
                    <QuickEntryBar />
                    {status === "user" && <QuickPicks />}
                  </motion.div>
                </ErrorBoundary>
                <ErrorBoundary title="Öğünler yüklenemedi">
                  <MealsCard
                    index={1}
                    status={status}
                    loading={today.loading}
                    error={today.error}
                    slots={progress.slots}
                    onPick={pickSlot}
                    onEdit={edit.open}
                    onSaveTemplate={(m) => void actions.saveAsTemplate(m)}
                    onDeleteMeal={(m) => void actions.remove(m)}
                    onDeleteItem={(m, i) => void actions.removeItem(m, i)}
                    onClearDay={() =>
                      clearToday.ask(today.meals.map((m) => m.id))
                    }
                    onRegister={() => openAuth("register")}
                    onLogin={() => openAuth("login")}
                  />
                </ErrorBoundary>
              </div>

              <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-2 xl:col-start-3 xl:row-start-1">
                <ErrorBoundary title="Su takibi yüklenemedi">
                  <WaterCard water={water} index={2} />
                </ErrorBoundary>
                <div ref={quickRef} className="scroll-mt-20">
                  <ErrorBoundary title="Hızlı ekle yüklenemedi">
                    <QuickAddCard quick={quick} index={3} />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            <div className={`min-w-0 ${panelClass("calendar")}`}>
              <ErrorBoundary title="Haftalık grafik yüklenemedi">
                <WeekCard week={week} index={4} ready={isClient} />
              </ErrorBoundary>
            </div>
            <div className={`min-w-0 ${panelClass("today")}`}>
              <ErrorBoundary title="Mikro besinler yüklenemedi">
                <MicroPanel micros={progress.micros} index={5} />
              </ErrorBoundary>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
            <motion.section
              {...cardEnter(6)}
              aria-labelledby="history-heading"
              className={`min-w-0 space-y-3 ${panelClass("calendar")}`}
            >
              <h2 id="history-heading" className="section-title">
                Geçmiş
              </h2>
              <ErrorBoundary title="Geçmiş yüklenemedi">
                <MealCalendar
                  onEdit={edit.open}
                  onDelete={actions.remove}
                  onClearDay={actions.clearDay}
                />
              </ErrorBoundary>
            </motion.section>

            <motion.div
              {...cardEnter(7)}
              ref={profileRef}
              id="panel-profile"
              aria-label="Beslenme planı"
              className={`min-w-0 scroll-mt-20 space-y-3 lg:scroll-mt-4 ${panelClass("profile")}`}
            >
              <h2 className="section-title">Beslenme planı</h2>
              <ErrorBoundary title="Plan yüklenemedi">
                <ActivePlanCard
                  plan={plan}
                  targets={targets}
                  source={source}
                  dayType={dayType}
                />
              </ErrorBoundary>
              <Link
                href={ROUTES.progress}
                className="card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2"
              >
                <span>
                  <span className="card-title block">Gelişim &amp; Analiz</span>
                  <span className="text-xs text-fg-muted">
                    Seri, hedef çizgisine karşı kaloriler ve ortalamalar
                  </span>
                </span>
                <LineChart
                  aria-hidden
                  className="size-5 shrink-0 text-fg-muted"
                />
              </Link>
            </motion.div>

            <motion.div
              {...cardEnter(8)}
              className={`min-w-0 space-y-3 ${panelClass("profile")}`}
            >
              <h2 className="section-title">Takip</h2>
              <ErrorBoundary title="Aralıklı oruç yüklenemedi">
                <FastingCard fasting={fasting} />
              </ErrorBoundary>
              <ErrorBoundary title="Kilo takibi yüklenemedi">
                <WeightCard log={weight} />
              </ErrorBoundary>
            </motion.div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={clearToday.open}
        title="Bugünün kaydı temizlensin mi?"
        message={`Bugün kaydedilen ${today.meals.length} öğünün tamamı silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Günü temizle"
        onConfirm={() =>
          clearToday.confirm((ids) => void actions.clearDay(ids))
        }
        onCancel={clearToday.cancel}
      />
      <MealEditDialog
        meal={edit.editing}
        saving={edit.saving}
        onSave={(input) => void edit.save(input)}
        onClose={edit.close}
      />
    </>
  );
}
