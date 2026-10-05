import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  selected: boolean;
  onSelect: () => void;
  title: string;
  hint?: string;
  icon?: ReactNode;
  children?: ReactNode;
  /** Radio semantics inside a `role="radiogroup"`. */
  role?: "radio" | "checkbox";
}

/** A selectable card (radio-like): ink outline + check when selected. */
export default function ChoiceCard({ selected, onSelect, title, hint, icon, children, role = "radio" }: Props) {
  return (
    <div
      role={role}
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative cursor-pointer rounded-[10px] border p-4 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "border-ink bg-surface shadow-[0_0_0_1px_var(--ink)]" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      {selected && (
        <span aria-hidden className="absolute top-3 right-3 flex size-5 animate-check-in items-center justify-center rounded-full bg-ink text-cta">
          <Check className="size-3" strokeWidth={3.5} />
        </span>
      )}
      {icon && (
        <span aria-hidden className={`mb-3 flex size-10 items-center justify-center rounded-[10px] ${selected ? "bg-cta text-cta-fg" : "bg-surface-2 text-fg-muted"}`}>
          {icon}
        </span>
      )}
      <p className="pr-6 text-sm font-semibold text-fg">{title}</p>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
      {children}
    </div>
  );
}
