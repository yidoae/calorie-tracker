import { MACRO_LABELS } from "@/lib/labels";
import type { MacroKey } from "@/types/nutrition";

const STYLES: Record<MacroKey, { label: string; unit: string; bar: string; dot: string }> = {
  calories: { label: MACRO_LABELS.calories, unit: "kcal", bar: "bg-macro-calories", dot: "bg-macro-calories" },
  protein: { label: MACRO_LABELS.protein, unit: "g", bar: "bg-macro-protein", dot: "bg-macro-protein" },
  carbs: { label: MACRO_LABELS.carbs, unit: "g", bar: "bg-macro-carbs", dot: "bg-macro-carbs" },
  fat: { label: MACRO_LABELS.fat, unit: "g", bar: "bg-macro-fat", dot: "bg-macro-fat" },
};

interface Props {
  macro: MacroKey;
  value: number;
  goal: number;
  /** "max" (default) flags exceeding the goal in red; "min" treats the goal as a floor to reach or beat. */
  mode?: "max" | "min";
}

export default function MacroProgress({ macro, value, goal, mode = "max" }: Props) {
  const { label, unit, bar, dot } = STYLES[macro];
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = mode === "max" && value > goal;
  const met = mode === "min" && goal > 0 && value >= goal;
  const rounded = Math.round(value);
  const status = over ? `${rounded - goal} ${unit} fazla` : met ? "hedefe ulaşıldı" : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
        <span className="flex items-center gap-2 font-medium text-fg">
          <span aria-hidden className={`size-2 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="whitespace-nowrap tabular-nums text-fg-subtle">
          <span className={`font-semibold ${over ? "text-danger-text" : met ? "text-success-text" : "text-fg"}`}>{rounded}</span>
          {" / "}
          {goal} {unit}
          {mode === "min" && " min"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(rounded, goal)}
        aria-valuetext={`${rounded} / ${goal} ${unit}${status ? `, ${status}` : ""}`}
        className="h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${over ? "bg-danger" : met ? "bg-success" : bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
