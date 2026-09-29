import { Check } from "lucide-react";
import { WIZARD_STEPS } from "@/hooks/usePlanWizard";

interface Props {
  step: number;
  stepValid: boolean[];
  onGoTo: (step: number) => void;
}

/** Step indicator: numbered pills joined by a progress line; finished steps can be revisited. */
export default function WizardProgress({ step, stepValid, onGoTo }: Props) {
  return (
    <nav aria-label="Plan adımları">
      <ol className="flex items-center gap-2">
        {WIZARD_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = i <= step || stepValid.slice(0, i).every(Boolean);
          return (
            <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onGoTo(i)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300 ${
                    current ? "border-ink bg-ink text-cta" : done ? "border-cta bg-cta text-cta-fg" : "border-border bg-surface text-fg-subtle"
                  }`}
                >
                  {done ? <Check aria-hidden className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`hidden truncate text-[13px] font-semibold md:block ${current ? "text-fg" : "text-fg-muted"}`}>{s.title}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <span aria-hidden className="h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <span className={`block h-full bg-cta transition-[width] duration-500 ease-out ${done ? "w-full" : "w-0"}`} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        Adım {step + 1} / {WIZARD_STEPS.length}: {WIZARD_STEPS[step].title}
      </p>
    </nav>
  );
}
