"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CustomPlan } from "@/lib/customPlan";
import { customPlanTargets } from "@/lib/customPlan";
import { calculateTargets, goalDirection, PACE_LEVELS, type Profile } from "@/lib/profile";
import ConfirmDialog from "./ConfirmDialog";
import CustomPlanBadge from "./CustomPlanBadge";

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

/** Summary of the active saved plan plus a switcher for every saved profile. */
export default function ProfileGoalsCard({ profiles, activeProfile, customPlan, onSelect, onEdit, onDelete, onNew }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState<Profile | null>(null);
  const customActive = customPlan?.active ?? false;
  const targets =
    customActive && customPlan ? customPlanTargets(customPlan) : activeProfile ? calculateTargets(activeProfile) : null;

  return (
    <section aria-labelledby="active-profile-heading" className="card p-4">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <h2 id="active-profile-heading" className="card-title">
          Active plan
        </h2>
        {customActive && <CustomPlanBadge />}
      </div>

      {activeProfile ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-fg">{activeProfile.label}</p>
            <p className="shrink-0 text-xs text-fg-subtle">
              {DIRECTION_LABEL[goalDirection(activeProfile)]}
              {goalDirection(activeProfile) !== "maintain" && ` · ${PACE_LEVELS[activeProfile.paceGoal].label}`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <div className="tile">
              <dt className="tile-label">Current weight</dt>
              <dd className="tile-value">{activeProfile.weightKg} kg</dd>
            </div>
            <div className="tile">
              <dt className="tile-label">Target weight</dt>
              <dd className="tile-value">{activeProfile.targetWeightKg != null ? `${activeProfile.targetWeightKg} kg` : "—"}</dd>
            </div>
          </dl>

          {targets && (
            <div>
              <p className="tile-label mb-1.5">{customActive ? "Custom daily targets" : "Daily targets"}</p>
              <dl className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ["Kcal", `${targets.calories}`],
                    ["Protein", `${targets.protein}g`],
                    ["Carbs", `${targets.carbs}g`],
                    ["Fat", `${targets.fat}g`],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="tile min-w-0 px-2 text-center">
                    <dt className="tile-label truncate">{label}</dt>
                    <dd className="tile-value truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-fg-subtle">No saved plan yet — use the calculator below to create one.</p>
      )}

      {profiles.length > 0 && (
        <ul aria-label="Saved plans" className="-mx-1.5 mt-4 space-y-0.5 border-t border-border pt-3">
          {profiles.map((p) => {
            const active = p.id === activeProfile?.id;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-1 rounded-lg py-1 pr-1 pl-1.5 transition-colors duration-150 ${
                  active ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  aria-pressed={active}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-accent bg-accent text-accent-fg" : "border-border-strong"
                    }`}
                  >
                    {active && <Check className="size-2.5" strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-fg">{p.label}</span>
                    <span className="block text-xs text-fg-subtle">
                      {p.weightKg} kg · {DIRECTION_LABEL[goalDirection(p)]}
                    </span>
                  </span>
                </button>
                <button type="button" aria-label={`Edit ${p.label}`} onClick={() => onEdit(p)} className="btn btn-ghost size-8 px-0">
                  <Pencil aria-hidden className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.label}`}
                  onClick={() => setConfirmingDelete(p)}
                  className="btn btn-ghost-danger size-8 px-0"
                >
                  <Trash2 aria-hidden className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={onNew} className="btn btn-secondary mt-3 w-full border-dashed shadow-none">
        <Plus aria-hidden className="size-4" /> New plan
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
