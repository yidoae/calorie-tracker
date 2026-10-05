import { FAT_PER_KG_RANGE, PROTEIN_PER_KG } from "@/types/plan";
import RangeSlider from "../ui/RangeSlider";

interface Props {
  id: string;
  value: number;
  /** Body weight for the gram preview; null while it isn't entered yet. */
  weightKg: number | null;
  onChange: (value: number) => void;
  /** Keto sets fat by itself (carbs are capped), so the slider is off. */
  disabled?: boolean;
}

const fmt = (n: number, digits: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Fat per kg slider (1.0–1.5 g/kg) with the fixed protein rule next to it; carbs take the rest. */
export default function FatPerKgControl({ id, value, weightKg, onChange, disabled = false }: Props) {
  const grams = weightKg ? Math.round(weightKg * value) : null;
  return (
    <div className="rounded-[10px] border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className={`text-sm font-semibold ${disabled ? "text-fg-subtle" : "text-fg"}`}>
          Yağ (kilo başına)
        </label>
        <p className={`font-display text-2xl tabular-nums ${disabled ? "text-fg-subtle" : ""}`}>
          {fmt(value, 2)} g/kg{grams !== null && <span className="ml-2 text-sm text-fg-muted">≈ {grams} g</span>}
        </p>
      </div>
      <div className="mt-3">
        <RangeSlider
          id={id}
          label="Kilo başına yağ"
          value={value}
          min={FAT_PER_KG_RANGE.min}
          max={FAT_PER_KG_RANGE.max}
          step={FAT_PER_KG_RANGE.step}
          onChange={onChange}
          valueText={`Kilogram başına ${fmt(value, 2)} gram yağ`}
          fillColor="var(--macro-fat)"
          disabled={disabled}
        />
      </div>
      <p className="hint">
        {disabled
          ? "Ketojenik düzende karbonhidrat 15–30 g'da sabit; yağ kalan kaloriyi tamamlar."
          : `Protein kilo başına ${fmt(PROTEIN_PER_KG, 1)} g sabit; karbonhidrat, protein ve yağdan kalan kaloriyi tamamlar.`}
      </p>
    </div>
  );
}
