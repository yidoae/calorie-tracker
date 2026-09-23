import type { MacroKey } from "@/lib/goals";

const STYLES: Record<MacroKey, { label: string; unit: string; bar: string }> = {
  calories: { label: "Calories", unit: "kcal", bar: "bg-orange-500" },
  protein: { label: "Protein", unit: "g", bar: "bg-rose-500" },
  carbs: { label: "Carbohydrates", unit: "g", bar: "bg-sky-500" },
  fat: { label: "Fat", unit: "g", bar: "bg-amber-500" },
};

interface Props {
  macro: MacroKey;
  value: number;
  goal: number;
  /** "max" (default) flags exceeding the goal in red; "min" treats the goal as a floor to reach or beat. */
  mode?: "max" | "min";
}

export default function MacroProgress({ macro, value, goal, mode = "max" }: Props) {
  const { label, unit, bar } = STYLES[macro];
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = mode === "max" && value > goal;
  const met = mode === "min" && goal > 0 && value >= goal;
  const rounded = Math.round(value);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          <span
            className={
              over
                ? "font-semibold text-red-600 dark:text-red-400"
                : met
                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                  : "font-semibold text-foreground"
            }
          >
            {rounded}
          </span>{" "}
          / {goal} {unit}
          {mode === "min" && " min"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={rounded}
        className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${over ? "bg-red-500" : met ? "bg-emerald-500" : bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
