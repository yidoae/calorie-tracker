import { LOCALE } from "@/lib/dates";

interface Props {
  id: string;
  /** Current factor relative to the estimate (1 = as estimated). */
  factor: number;
  grams: number;
  /** Contents of the gram field (empty until the user types, when grams are asked for). */
  gramText: string;
  /** Highlights the gram field as required. */
  missing: boolean;
  steps: readonly number[];
  range: { min: number; max: number; step: number };
  onChange: (factor: number) => void;
  onGramsChange: (text: string) => void;
  label: string;
}

const fmtFactor = (f: number) => `${f.toLocaleString(LOCALE, { maximumFractionDigits: 2 })}×`;

/** Portion slider, a gram field and one-tap presets (½×, 1×, 1½×, 2×). */
export default function PortionControl({ id, factor, grams, gramText, missing, steps, range, onChange, onGramsChange, label }: Props) {
  const shown = Math.min(range.max, Math.max(range.min, factor));
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
          value={shown}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={missing ? "gram girilmedi" : `${grams} gram, ${fmtFactor(factor)}`}
          className="portion-slider h-6 min-w-0 flex-1 cursor-pointer"
          style={{ "--fill": `${missing ? 0 : ((shown - range.min) / (range.max - range.min)) * 100}%` } as React.CSSProperties}
        />
        <label className="flex shrink-0 items-center gap-1 font-display text-sm">
          <span className="sr-only">{label} kaç gram</span>
          <input
            value={gramText}
            onChange={(e) => onGramsChange(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="Gram"
            aria-invalid={missing}
            className={`input h-8 w-20 px-2 text-right ${missing ? "border-warning-text ring-4 ring-warning-soft" : ""}`}
          />
          g
        </label>
      </div>
      {missing && <p className="text-xs text-warning-text">Kaç gram yediğini yaz.</p>}
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
