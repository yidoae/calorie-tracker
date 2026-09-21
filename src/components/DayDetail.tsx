import { MACRO_KEYS, sumMacros, type Macros } from "@/lib/goals";
import type { MealDTO } from "@/lib/types";
import MacroProgress from "./MacroProgress";
import MealThumb from "./MealThumb";

interface Props {
  meals: MealDTO[];
  targets: Macros;
}

/** One day's totals against the targets, plus a compact list of its meals. */
export default function DayDetail({ meals, targets }: Props) {
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
          <MacroProgress key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} />
        ))}
      </section>

      <section aria-label="Meals">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Meals ({meals.length})
        </h3>
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
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
