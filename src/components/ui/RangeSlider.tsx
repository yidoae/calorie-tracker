interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Screen-reader text for the current value, e.g. "180 gram, 2,0 g/kg". */
  valueText: string;
  /** CSS colour of the filled part (a token, e.g. "var(--macro-protein)"); lime by default. */
  fillColor?: string;
  disabled?: boolean;
}

/** Styled range input, filled up to the thumb. */
export default function RangeSlider({ id, label, value, min, max, step, onChange, valueText, fillColor, disabled = false }: Props) {
  const fill = max > min ? ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100 : 0;
  const style = { "--fill": `${fill}%`, ...(fillColor ? { "--fill-color": fillColor } : {}) } as React.CSSProperties;
  return (
    <input
      id={id}
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-valuetext={valueText}
      className="portion-slider h-6 w-full cursor-pointer disabled:cursor-not-allowed"
      style={style}
    />
  );
}
