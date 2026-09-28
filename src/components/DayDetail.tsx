"use client";

import { CalendarX2, Trash2 } from "lucide-react";
import { useState } from "react";
import { MACRO_KEYS, sumMacros, type Macros } from "@/lib/goals";
import { LOCALE } from "@/lib/dates";
import type { MealDTO } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
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
    return <EmptyState icon={<CalendarX2 />} title="Nothing logged" description="No meals were logged on this day." className="py-8" />;
  }

  const totals = sumMacros(meals);
  // The API returns newest first; read the day chronologically.
  const chronological = [...meals].reverse();

  return (
    <div className="space-y-5">
      <section aria-label="Totals" className="space-y-3.5">
        {MACRO_KEYS.map((macro) => (
          <MacroProgress key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} mode={macro === "protein" ? "min" : "max"} />
        ))}
      </section>

      <section aria-label="Meals" className="border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="section-title">
            Meals <span className="text-fg-subtle tabular-nums">{meals.length}</span>
          </h4>
          <button type="button" onClick={() => setConfirmingClear(true)} className="btn btn-ghost-danger h-7 px-2 text-xs">
            <Trash2 aria-hidden className="size-3.5" /> Clear day
          </button>
        </div>
        <ul className="-mx-2 space-y-0.5">
          {chronological.map((meal) => (
            <li key={meal.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2">
              <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-fg">{meal.name}</p>
                <time dateTime={meal.createdAt} className="text-xs text-fg-subtle">
                  {new Date(meal.createdAt).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
              <p className="shrink-0 text-[13px] font-medium tabular-nums text-fg">{meal.calories} kcal</p>
              <button
                type="button"
                aria-label={`Delete ${meal.name}`}
                onClick={() => setPending(meal)}
                className="btn btn-ghost-danger size-7 px-0"
              >
                <Trash2 aria-hidden className="size-3.5" />
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
