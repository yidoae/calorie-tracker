"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { MealDTO } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import MealThumb from "./MealThumb";

interface Props {
  meals: MealDTO[];
  onDelete: (id: string) => void;
}

export default function MealTimeline({ meals, onDelete }: Props) {
  const [pending, setPending] = useState<MealDTO | null>(null);

  if (meals.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No meals logged today. Snap a photo to get started.
      </p>
    );
  }

  return (
    <>
      <ol className="space-y-3">
        {meals.map((meal) => (
          <li
            key={meal.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={64} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate font-medium">{meal.name}</h3>
                <time dateTime={meal.createdAt} className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(meal.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{meal.calories} kcal</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
              </p>
            </div>

            <button
              type="button"
              aria-label={`Delete ${meal.name}`}
              onClick={() => setPending(meal)}
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <Trash2 className="size-5" />
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
