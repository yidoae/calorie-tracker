"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { MACRO_KEYS, sumMacros, type Macros } from "@/lib/goals";
import type { MealDTO } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import MacroProgress from "./MacroProgress";
import MealThumb from "./MealThumb";

interface Props {
  meals: MealDTO[];
  targets: Macros;
  onDelete: (id: string) => void;
  onClearDay: (ids: string[]) => void;
}

/** One day's totals against the targets, plus a compact list of its meals. */
export default function DayDetail({ meals, targets, onDelete, onClearDay }: Props) {
  const [pending, setPending] = useState<MealDTO | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (meals.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No meals logged on this day.
      </p>
    );
  }

  const totals = sumMacros(meals);
  // The API returns newest first; read the day chronologically.
  const chronological = [...meals].reverse();

  return (
    <div className="space-y-5">
      <section aria-label="Totals" className="space-y-4">
        {MACRO_KEYS.map((macro) => (
          <MacroProgress key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} mode={macro === "protein" ? "min" : "max"} />
        ))}
      </section>

      <section aria-label="Meals">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Meals ({meals.length})
          </h3>
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
          >
            Clear day
          </button>
        </div>
        <ul className="space-y-2">
          {chronological.map((meal) => (
            <li key={meal.id} className="flex items-center gap-3">
              <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{meal.name}</p>
                <time dateTime={meal.createdAt} className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(meal.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                {meal.calories} kcal
              </p>
              <button
                type="button"
                aria-label={`Delete ${meal.name}`}
                onClick={() => setPending(meal)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title="Delete this meal?"
        message={pending ? `"${pending.name}" will be removed from this day's log. This can't be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={() => {
          if (pending) onDelete(pending.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={confirmingClear}
        title="Clear this day?"
        message={`All ${meals.length} meal${meals.length === 1 ? "" : "s"} logged on this day will be removed. This can't be undone.`}
        confirmLabel="Clear day"
        onConfirm={() => {
          onClearDay(meals.map((m) => m.id));
          setConfirmingClear(false);
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </div>
  );
}
