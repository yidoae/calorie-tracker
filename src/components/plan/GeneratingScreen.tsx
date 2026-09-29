import { Check, Loader2 } from "lucide-react";
import { GENERATION_STEPS } from "@/hooks/usePlanBuilder";
import FitBotAvatar from "../ui/FitBotAvatar";

/** Stepped loading screen while FitBot builds the plan. */
export default function GeneratingScreen({ stepIndex }: { stepIndex: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="card mx-auto max-w-xl animate-enter p-6 text-center sm:p-10">
      <div className="relative mx-auto size-20">
        <span aria-hidden className="absolute inset-0 animate-breathe rounded-full bg-cta" />
        <FitBotAvatar className="relative size-20" />
      </div>
      <h2 className="mt-6 font-display text-2xl">FitBot planını hazırlıyor</h2>
      <p className="mt-1 text-[13px] text-fg-muted">Yerel yapay zekâ ilk seferde birkaç saniye sürebilir.</p>

      <ol className="mx-auto mt-6 max-w-xs space-y-3 text-left">
        {GENERATION_STEPS.map((label, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  state === "done" ? "bg-cta text-cta-fg" : state === "active" ? "bg-ink text-cta" : "bg-surface-3 text-fg-subtle"
                }`}
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : state === "active" ? <Loader2 className="size-3.5 animate-spin" /> : i + 1}
              </span>
              <span className={state === "pending" ? "text-fg-subtle" : "font-medium text-fg"}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div aria-hidden className="mt-8 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}
