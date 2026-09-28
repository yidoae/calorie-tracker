"use client";

import { Camera, Trash2 } from "lucide-react";
import { useState } from "react";
import { LOCALE } from "@/lib/dates";
import type { MealDTO } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MealThumb from "./MealThumb";

interface Props {
  meals: MealDTO[];
  onDelete: (id: string) => void;
}

/** Placeholder rows shown while today's meals load. */
export function MealTimelineSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading meals" className="card divide-y divide-border">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="skeleton size-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MealTimeline({ meals, onDelete }: Props) {
  const [pending, setPending] = useState<MealDTO | null>(null);

  if (meals.length === 0) {
    return (
      <EmptyState
        icon={<Camera />}
        title="No meals logged today"
        description="Snap or upload a photo of your meal and we'll estimate the calories and macros."
      />
    );
  }

  return (
    <>
      <ol className="card divide-y divide-border overflow-hidden">
        {meals.map((meal) => (
          <li key={meal.id} className="group flex animate-enter items-center gap-3 p-3 transition-colors hover:bg-surface-2/60">
            <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={48} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-sm font-medium text-fg">{meal.name}</h3>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                  {meal.calories} <span className="text-xs font-normal text-fg-subtle">kcal</span>
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-fg-subtle tabular-nums">
                <p className="truncate">
                  P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                </p>
                <time dateTime={meal.createdAt} className="shrink-0">
                  {new Date(meal.createdAt).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
            </div>

            <button
              type="button"
              aria-label={`Delete ${meal.name}`}
              onClick={() => setPending(meal)}
              className="btn btn-icon-sm btn-ghost-danger"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={pending !== null}
        title="Delete this meal?"
        message={pending ? `"${pending.name}" will be removed from today's log. This can't be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={() => {
          if (pending) onDelete(pending.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
