import { LOCALE } from "@/lib/dates";

interface Props {
  id: string;
  /** Current factor relative to the estimate (1 = as estimated). */
  factor: number;
  grams: number;
  steps: readonly number[];
  range: { min: number; max: number; step: number };
  onChange: (factor: number) => void;
  label: string;
}

const fmtFactor = (f: number) => `${f.toLocaleString(LOCALE, { maximumFractionDigits: 2 })}×`;

/** Portion slider plus one-tap presets (½×, 1×, 1½×, 2×). */
export default function PortionControl({ id, factor, grams, steps, range, onChange, label }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="sr-only">
          {label} porsiyonu
        </label>
        <input
          id={id}
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={factor}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`${grams} gram, ${fmtFactor(factor)}`}
          className="portion-slider h-6 min-w-0 flex-1 cursor-pointer"
          style={{ "--fill": `${((factor - range.min) / (range.max - range.min)) * 100}%` } as React.CSSProperties}
        />
        <span className="w-16 shrink-0 text-right font-display text-sm tabular-nums">{grams} g</span>
      </div>
      <div role="group" aria-label={`${label} hızlı porsiyon`} className="flex gap-1">
        {steps.map((s) => {
          const active = Math.abs(factor - s) < 0.001;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(s)}
              className={`h-7 flex-1 cursor-pointer rounded-[4px] border text-xs font-semibold tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                active ? "border-ink bg-ink text-on-ink" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
              }`}
            >
              {fmtFactor(s)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
