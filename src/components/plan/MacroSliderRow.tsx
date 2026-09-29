import RangeSlider from "../ui/RangeSlider";

interface Props {
  id: string;
  label: string;
  grams: number;
  range: { min: number; max: number; step: number };
  /** Share of the day's calories, 0–100. */
  percentOfCalories: number;
  /** g per kg of body weight, shown for protein and fat. */
  perKg?: number;
  /** CSS colour variable for the dot and the slider fill, e.g. "var(--macro-protein)". */
  color: string;
  dotClass: string;
  onChange: (grams: number) => void;
}

const fmt = (n: number, digits = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** One macro on the tuning desk: grams, g/kg badge, share of calories and a coloured slider. */
export default function MacroSliderRow({ id, label, grams, range, percentOfCalories, perKg, color, dotClass, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className={`size-2.5 rounded-full ${dotClass}`} />
          {label}
        </label>
        <div className="flex items-baseline gap-2">
          {perKg !== undefined && (
            <span className="badge bg-surface-3 text-fg tabular-nums" title="Vücut ağırlığının kilogramı başına">
              {fmt(perKg, 1)} g/kg
            </span>
          )}
          <span className="text-xs text-fg-muted tabular-nums">%{Math.round(percentOfCalories)}</span>
          <span className="w-20 text-right font-display text-xl tabular-nums">{fmt(grams)} g</span>
        </div>
      </div>
      <RangeSlider
        id={id}
        label={label}
        value={grams}
        min={range.min}
        max={range.max}
        step={range.step}
        onChange={onChange}
        valueText={`${grams} gram${perKg !== undefined ? `, ${fmt(perKg, 1)} g/kg` : ""}`}
        fillColor={color}
      />
    </div>
  );
}
