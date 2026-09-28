import { Sparkles } from "lucide-react";

/** Shown wherever targets come from the manually-authored custom plan rather than the calculator. */
export default function CustomPlanBadge() {
  return (
    <span className="badge bg-accent-soft text-accent-text">
      <Sparkles aria-hidden className="size-3" /> Custom plan
    </span>
  );
}
