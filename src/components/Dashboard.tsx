"use client";

import { CalendarDays, Trash2, UserRound, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { customPlanTargets, type CustomPlan } from "@/lib/customPlan";
import { DAILY_GOALS, sumMacros, type MacroKey } from "@/lib/goals";
import { calculateTargets, type Profile } from "@/lib/profile";
import type { MealDTO } from "@/lib/types";
import { useProfile } from "@/lib/useProfile";
import ConfirmDialog from "./ConfirmDialog";
import CustomPlanBadge from "./CustomPlanBadge";
import CustomPlanCard from "./CustomPlanCard";
import MacroProgress from "./MacroProgress";
import MealCalendar from "./MealCalendar";
import MealTimeline, { MealTimelineSkeleton } from "./MealTimeline";
import MealUploader from "./MealUploader";
import ProfileGoalsCard from "./ProfileGoalsCard";
import ProfilePanel from "./ProfilePanel";
import Segmented, { type SegmentedItem } from "./Segmented";

type Panel = "calendar" | "today" | "profile";
type ProfileTab = "calculator" | "custom";

const TABS: SegmentedItem<Panel>[] = [
  { id: "calendar", label: "History", icon: <CalendarDays aria-hidden className="size-4" /> },
  { id: "today", label: "Today", icon: <Utensils aria-hidden className="size-4" /> },
  { id: "profile", label: "Profile", icon: <UserRound aria-hidden className="size-4" /> },
];

const PROFILE_TABS: SegmentedItem<ProfileTab>[] = [
  { id: "calculator", label: "Calculator" },
  { id: "custom", label: "Custom plan" },
];

const MACROS: MacroKey[] = ["protein", "carbs", "fat"];

export default function Dashboard() {
  const [meals, setMeals] = useState<MealDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Below `lg` the three columns become tabs; from `lg` up every panel is visible and this is ignored.
  const [activePanel, setActivePanel] = useState<Panel>("today");
  // Bumped whenever a meal is added or deleted so the calendar refetches its month.
  const [mealsVersion, setMealsVersion] = useState(0);
  const [profileTab, setProfileTab] = useState<ProfileTab>("calculator");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [confirmingClearToday, setConfirmingClearToday] = useState(false);

  const { profiles, activeProfile, customPlan, saveProfile, deleteProfile, setActiveProfileId, saveCustomPlan, clearCustomPlan } =
    useProfile();

  const customActive = customPlan?.active ?? false;
  const targets = useMemo(() => {
    if (customActive && customPlan) return customPlanTargets(customPlan);
    return activeProfile ? calculateTargets(activeProfile) : DAILY_GOALS;
  }, [customActive, customPlan, activeProfile]);

  // Load today's meals using the browser's local-day boundaries.
  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const query = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
    fetch(`/api/meals?${query}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Couldn't load today's meals."))))
      .then((data: MealDTO[]) => setMeals(data))
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => sumMacros(meals), [meals]);
  const remaining = targets.calories - Math.round(totals.calories);
  const caloriePercent = targets.calories > 0 ? Math.min(100, (totals.calories / targets.calories) * 100) : 0;

  function addMeal(meal: MealDTO) {
    setMeals((prev) => [meal, ...prev]);
    setMealsVersion((v) => v + 1);
  }

  async function deleteMeal(id: string) {
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) {
      setMeals((prev) => prev.filter((m) => m.id !== id));
      setMealsVersion((v) => v + 1);
    }
  }

  async function clearDay(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/meals/${id}`, { method: "DELETE" })));
    setMeals((prev) => prev.filter((m) => !ids.includes(m.id)));
    setMealsVersion((v) => v + 1);
  }

  function saveCustomPlanForm(plan: CustomPlan) {
    saveCustomPlan(plan);
  }

  /** Visible when its tab is active on small screens; always visible from `lg`. */
  const panelClass = (id: Panel) => (id === activePanel ? "block" : "hidden lg:block");

  return (
    <div>
      {/* Phone/tablet section switcher; sticks under the top edge while scrolling. */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-bg/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <Segmented items={TABS} value={activePanel} onChange={setActivePanel} label="Dashboard sections" idPrefix="panel" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18.5rem_minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
        <aside id="panel-calendar" aria-label="Calendar and history" className={`space-y-3 ${panelClass("calendar")}`}>
          <h2 className="section-title hidden lg:block">History</h2>
          <MealCalendar targets={targets} refreshKey={mealsVersion} onDelete={deleteMeal} onClearDay={clearDay} />
        </aside>

        <div id="panel-today" className={`min-w-0 space-y-6 ${panelClass("today")}`}>
          <MealUploader onMealAdded={addMeal} />

          <section aria-labelledby="progress-heading" className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 id="progress-heading" className="section-title">
                Today&apos;s progress
              </h2>
              {customActive && <CustomPlanBadge />}
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <p className="tabular-nums">
                <span className="text-3xl font-semibold tracking-[-0.03em] text-fg">{Math.round(totals.calories)}</span>
                <span className="ml-1.5 text-[13px] text-fg-subtle">/ {targets.calories} kcal</span>
              </p>
              <p className={`text-[13px] font-medium tabular-nums ${remaining < 0 ? "text-danger-text" : "text-fg-muted"}`}>
                {remaining < 0 ? `${-remaining} kcal over` : `${remaining} kcal left`}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Calories"
              aria-valuemin={0}
              aria-valuemax={targets.calories}
              aria-valuenow={Math.min(Math.round(totals.calories), targets.calories)}
              aria-valuetext={`${Math.round(totals.calories)} of ${targets.calories} kcal`}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3"
            >
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${remaining < 0 ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>

            <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3 sm:gap-5">
              {MACROS.map((macro) => (
                <MacroProgress key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} mode={macro === "protein" ? "min" : "max"} />
              ))}
            </div>

            {!activeProfile && !customActive && (
              <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                Showing default goals.{" "}
                <button
                  type="button"
                  onClick={() => setActivePanel("profile")}
                  className="cursor-pointer rounded font-medium text-accent-text underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                >
                  Set up your profile
                </button>
                <span className="hidden lg:inline">Fill in your profile on the right</span> to get personal targets.
              </p>
            )}
          </section>

          <section aria-labelledby="timeline-heading">
            <div className="mb-3 flex min-h-8 items-center justify-between">
              <h2 id="timeline-heading" className="section-title">
                Today&apos;s meals
                {meals.length > 0 && <span className="ml-1.5 text-fg-subtle tabular-nums">{meals.length}</span>}
              </h2>
              {meals.length > 0 && (
                <button type="button" onClick={() => setConfirmingClearToday(true)} className="btn btn-ghost-danger h-8 px-2.5 text-xs">
                  <Trash2 aria-hidden className="size-3.5" /> Clear day
                </button>
              )}
            </div>
            {loadError ? (
              <p role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-[13px] text-danger-text">
                {loadError}
              </p>
            ) : loading ? (
              <MealTimelineSkeleton />
            ) : (
              <MealTimeline meals={meals} onDelete={deleteMeal} />
            )}
          </section>
        </div>

        <aside id="panel-profile" aria-label="Profile and targets" className={`space-y-4 ${panelClass("profile")}`}>
          <h2 className="section-title hidden lg:block">Profile &amp; targets</h2>

          <ProfileGoalsCard
            profiles={profiles}
            activeProfile={activeProfile}
            customPlan={customPlan}
            onSelect={setActiveProfileId}
            onEdit={(p) => {
              setEditingProfile(p);
              setProfileTab("calculator");
            }}
            onDelete={deleteProfile}
            onNew={() => {
              setEditingProfile(null);
              setProfileTab("calculator");
            }}
          />

          <Segmented items={PROFILE_TABS} value={profileTab} onChange={setProfileTab} label="Targets source" idPrefix="targets" />

          <div id={`targets-${profileTab}`} role="tabpanel" aria-labelledby={`targets-tab-${profileTab}`}>
            {profileTab === "calculator" ? (
              <ProfilePanel
                key={editingProfile ? JSON.stringify(editingProfile) : "new"}
                editing={editingProfile}
                onSave={(p) => {
                  saveProfile(p);
                  setEditingProfile(null);
                }}
              />
            ) : (
              <CustomPlanCard customPlan={customPlan} onSave={saveCustomPlanForm} onRemove={clearCustomPlan} />
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingClearToday}
        title="Clear today's log?"
        message={`All ${meals.length} meal${meals.length === 1 ? "" : "s"} logged today will be removed. This can't be undone.`}
        confirmLabel="Clear day"
        onConfirm={() => {
          void clearDay(meals.map((m) => m.id));
          setConfirmingClearToday(false);
        }}
        onCancel={() => setConfirmingClearToday(false)}
      />
    </div>
  );
}
