"use client";

import { CalendarDays, Sparkles, Trash2, UserRound, Utensils } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { customPlanTargets, type CustomPlan } from "@/lib/customPlan";
import { DAILY_GOALS, MACRO_KEYS, sumMacros } from "@/lib/goals";
import { calculateTargets, type Profile } from "@/lib/profile";
import type { MealDTO } from "@/lib/types";
import { useProfile } from "@/lib/useProfile";
import ConfirmDialog from "./ConfirmDialog";
import CustomPlanCard from "./CustomPlanCard";
import MacroProgress from "./MacroProgress";
import MealCalendar from "./MealCalendar";
import MealTimeline from "./MealTimeline";
import MealUploader from "./MealUploader";
import ProfileGoalsCard from "./ProfileGoalsCard";
import ProfilePanel from "./ProfilePanel";

type Panel = "calendar" | "today" | "profile";
type ProfileTab = "calculator" | "custom";

const TABS: { id: Panel; label: string; icon: ReactNode }[] = [
  { id: "calendar", label: "Calendar", icon: <CalendarDays className="size-4" /> },
  { id: "today", label: "Today", icon: <Utensils className="size-4" /> },
  { id: "profile", label: "Profile", icon: <UserRound className="size-4" /> },
];

const sectionHeading = "text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

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
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load meals"))))
      .then((data: MealDTO[]) => setMeals(data))
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => sumMacros(meals), [meals]);

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
      <nav aria-label="Dashboard sections" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-zinc-200/70 p-1 lg:hidden dark:bg-zinc-800">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            aria-current={id === activePanel ? "true" : undefined}
            onClick={() => setActivePanel(id)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
              id === activePanel
                ? "bg-white text-foreground shadow-sm dark:bg-zinc-900"
                : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)_21rem] lg:items-start">
        <aside aria-label="Calendar and history" className={panelClass("calendar")}>
          <h2 className={`mb-3 hidden lg:block ${sectionHeading}`}>History</h2>
          <MealCalendar targets={targets} refreshKey={mealsVersion} onDelete={deleteMeal} onClearDay={clearDay} />
        </aside>

        <div className={`space-y-6 ${panelClass("today")}`}>
          <MealUploader onMealAdded={addMeal} />

          <section
            aria-labelledby="progress-heading"
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="progress-heading" className={sectionHeading}>
                Today&apos;s progress
              </h2>
              {customActive && (
                <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  <Sparkles className="size-3.5" /> Özel Plan Aktif
                </span>
              )}
            </div>
            {!activeProfile && !customActive && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing default goals.{" "}
                <button
                  type="button"
                  onClick={() => setActivePanel("profile")}
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline lg:hidden dark:text-emerald-400"
                >
                  Set up your profile
                </button>
                <span className="hidden lg:inline">Fill in your profile on the right</span> to get targets calculated for you.
              </p>
            )}
            {MACRO_KEYS.map((macro) => (
              <MacroProgress key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} mode={macro === "protein" ? "min" : "max"} />
            ))}
          </section>

          <section aria-labelledby="timeline-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="timeline-heading" className={sectionHeading}>
                Today&apos;s meals
              </h2>
              {meals.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmingClearToday(true)}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                >
                  <Trash2 className="size-3.5" /> Clear day
                </button>
              )}
            </div>
            {loadError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {loadError}
              </p>
            ) : loading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : (
              <MealTimeline meals={meals} onDelete={deleteMeal} />
            )}
          </section>
        </div>

        <aside aria-label="Profile and targets" className={`space-y-4 ${panelClass("profile")}`}>
          <h2 className={`hidden lg:block ${sectionHeading}`}>Profile &amp; targets</h2>

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

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-800">
            {(
              [
                { id: "calculator", label: "Calculator" },
                { id: "custom", label: "Kendi Planım" },
              ] as { id: ProfileTab; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-current={id === profileTab ? "true" : undefined}
                onClick={() => setProfileTab(id)}
                className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  id === profileTab
                    ? "bg-white text-foreground shadow-sm dark:bg-zinc-900"
                    : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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
