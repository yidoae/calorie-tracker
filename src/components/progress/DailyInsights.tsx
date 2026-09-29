import { CircleCheck, Info, Sparkles, TriangleAlert } from "lucide-react";
import type { Insight, InsightTone } from "@/lib/nutrition/insights";

const ICON: Record<InsightTone, React.ComponentType<{ className?: string }>> = {
  success: CircleCheck,
  warning: TriangleAlert,
  info: Info,
};

const TONE: Record<InsightTone, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  info: "bg-accent-soft text-accent-text",
};

interface Props {
  title: string;
  insights: Insight[];
  loading: boolean;
}

/** The smart daily summary: macro gaps and a concrete suggestion to close them. */
export default function DailyInsights({ title, insights, loading }: Props) {
  return (
    <section aria-labelledby="insights-heading" className="card p-4 sm:p-6">
      <h2 id="insights-heading" className="section-title flex items-center gap-2">
        <Sparkles aria-hidden className="size-4 text-accent" /> {title}
      </h2>
      {loading ? (
        <div aria-busy="true" aria-label="Özet hazırlanıyor" className="mt-4 space-y-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {insights.map((insight) => {
            const Icon = ICON[insight.tone];
            return (
              <li key={insight.id} className="flex animate-enter items-start gap-3">
                <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-[6px] ${TONE[insight.tone]}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  {insight.detail && <p className="mt-1 text-[13px] text-fg-muted">{insight.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
