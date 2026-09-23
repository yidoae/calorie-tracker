"use client";

import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CustomPlan } from "@/lib/customPlan";
import { customPlanTargets } from "@/lib/customPlan";
import { calculateTargets, goalDirection, PACE_LEVELS, type Profile } from "@/lib/profile";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  profiles: Profile[];
  activeProfile: Profile | null;
  customPlan: CustomPlan | null;
  onSelect: (id: string) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const DIRECTION_LABEL: Record<ReturnType<typeof goalDirection>, string> = {
  cut: "Cutting",
  bulk: "Bulking",
  maintain: "Maintaining",
};

const tile = "rounded-lg bg-zinc-100 p-2 text-center dark:bg-zinc-800";
const tileLabel = "text-[11px] text-zinc-500 dark:text-zinc-400";

/** Summary of the active saved plan plus a switcher for every saved profile. */
export default function ProfileGoalsCard({ profiles, activeProfile, customPlan, onSelect, onEdit, onDelete, onNew }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState<Profile | null>(null);
  const customActive = customPlan?.active ?? false;
  const targets =
    customActive && customPlan ? customPlanTargets(customPlan) : activeProfile ? calculateTargets(activeProfile) : null;

  return (
    <section
      aria-labelledby="active-profile-heading"
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <h2 id="active-profile-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Active profile &amp; goals
        </h2>
        {customActive && (
          <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" /> Özel Plan Aktif
          </span>
        )}
      </div>

      {activeProfile ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-medium">{activeProfile.label}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {DIRECTION_LABEL[goalDirection(activeProfile)]}
              {goalDirection(activeProfile) !== "maintain" && ` · ${PACE_LEVELS[activeProfile.paceGoal].label}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={tile}>
              <p className={tileLabel}>Current weight</p>
              <p className="font-semibold tabular-nums">{activeProfile.weightKg} kg</p>
            </div>
            <div className={tile}>
              <p className={tileLabel}>Target weight</p>
              <p className="font-semibold tabular-nums">
                {activeProfile.targetWeightKg != null ? `${activeProfile.targetWeightKg} kg` : "—"}
              </p>
            </div>
          </div>

          {targets && (
            <div>
              <p className={`${tileLabel} mb-1.5`}>{customActive ? "Custom daily targets" : "Daily targets"}</p>
              <div className="grid grid-cols-4 gap-2">
                <div className={tile}>
                  <p className={tileLabel}>Kcal</p>
                  <p className="font-semibold tabular-nums text-orange-600 dark:text-orange-400">{targets.calories}</p>
                </div>
                <div className={tile}>
                  <p className={tileLabel}>Protein</p>
                  <p className="font-semibold tabular-nums">{targets.protein}g</p>
                </div>
                <div className={tile}>
                  <p className={tileLabel}>Carbs</p>
                  <p className="font-semibold tabular-nums">{targets.carbs}g</p>
                </div>
                <div className={tile}>
                  <p className={tileLabel}>Fat</p>
                  <p className="font-semibold tabular-nums">{targets.fat}g</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No saved plan yet — use the calculator below to create one.
        </p>
      )}

      {profiles.length > 0 && (
        <ul className="space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {profiles.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
                p.id === activeProfile?.id ? "bg-emerald-50 dark:bg-emerald-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-pressed={p.id === activeProfile?.id}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">{p.label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.weightKg} kg · {DIRECTION_LABEL[goalDirection(p)]}
                </p>
              </button>
              <button
                type="button"
                aria-label={`Edit ${p.label}`}
                onClick={() => onEdit(p)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-700"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${p.label}`}
                onClick={() => setConfirmingDelete(p)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onNew}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
      >
        <Plus className="size-4" /> New profile
      </button>

      <ConfirmDialog
        open={confirmingDelete !== null}
        title="Delete this plan?"
        message={confirmingDelete ? `"${confirmingDelete.label}" will be removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmingDelete) onDelete(confirmingDelete.id);
          setConfirmingDelete(null);
        }}
        onCancel={() => setConfirmingDelete(null)}
      />
    </section>
  );
}
