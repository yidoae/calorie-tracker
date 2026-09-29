interface Props {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Accessible on/off switch with a label and optional description. */
export default function Switch({ id, checked, onChange, label, description, disabled = false }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className={`text-sm font-semibold ${disabled ? "text-fg-subtle" : "text-fg"}`}>
          {label}
        </label>
        {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 cursor-pointer rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
          checked ? "bg-ink" : "bg-surface-3"
        } ${disabled ? "bg-surface-3" : ""}`}
      >
        <span
          aria-hidden
          className={`absolute top-1 left-1 size-5 rounded-full shadow-xs transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            checked ? "translate-x-5 bg-cta" : "bg-surface"
          }`}
        />
      </button>
    </div>
  );
}
