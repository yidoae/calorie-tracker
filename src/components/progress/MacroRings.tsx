import type { RingState } from "@/hooks/useDailyProgress";
import { LOCALE } from "@/lib/dates";
import type { MacroKey } from "@/types/nutrition";
import ProgressRing from "../ui/ProgressRing";

const ARC: Record<Exclude<MacroKey, "calories">, string> = {
  protein: "stroke-macro-protein",
  carbs: "stroke-macro-carbs",
  fat: "stroke-macro-fat",
};

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** One ring per macro. Protein is a minimum (check when met); carbs and fat are limits (red when over). */
export default function MacroRings({ rings }: { rings: RingState[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-4">
      {rings.map((r) => {
        const arc = r.over ? "stroke-danger" : ARC[r.key as keyof typeof ARC];
        const suffix = r.key === "protein" ? "en az" : "hedef";
        return (
          <li key={r.key} className="flex flex-col items-center text-center">
            <ProgressRing
              progress={r.progress}
              size={88}
              stroke={8}
              arcClass={arc}
              reached={r.reached}
              celebrating={r.celebrating}
              label={r.label}
              valueText={`${fmt(r.value)} / ${fmt(r.goal)} g${r.over ? `, ${fmt(r.value - r.goal)} g fazla` : ""}`}
            >
              <span className={`font-display text-lg leading-none tabular-nums ${r.over ? "text-danger-text" : "text-fg"}`}>{fmt(r.value)}</span>
              <span className="text-[11px] text-fg-muted">g</span>
            </ProgressRing>
            <p className="mt-2 text-[13px] font-semibold">{r.label}</p>
            <p className="text-xs text-fg-muted tabular-nums">
              {fmt(r.goal)} g {suffix}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
