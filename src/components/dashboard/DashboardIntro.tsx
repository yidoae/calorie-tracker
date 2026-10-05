"use client";

import { LOCALE } from "@/lib/dates";
import MaskedWords from "../landing/MaskedWords";

interface Props {
  username: string | null;
  /** Today's calorie target. */
  goalKcal: number;
  /** False until the browser's clock is available (hydration). */
  ready: boolean;
}

function greeting(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

/** The ink band under the nav: a time-of-day greeting with the name in lime, today's date and target. */
export default function DashboardIntro({ username, goalKcal, ready }: Props) {
  const now = ready ? new Date() : null;
  const hello = now ? greeting(now.getHours()) : "Merhaba";

  return (
    <section aria-labelledby="intro-heading" className="bg-ink text-on-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pt-4 pb-10 sm:px-6 sm:pt-6 sm:pb-14">
        <div>
          <h1 id="intro-heading" className="font-display text-[clamp(28px,4.4vw,44px)] leading-[1.05] tracking-[-0.02em]">
            <MaskedWords key={hello} text={`${hello},`} /> <MaskedWords text={username ?? "misafir"} delay={0.12} className="text-cta" />
          </h1>
          <p className="mt-1.5 text-sm text-on-ink-muted">
            {now ? now.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", weekday: "long" }) : "Bugün"} · Günlük hedef{" "}
            <span className="font-semibold text-on-ink tabular-nums">{Math.round(goalKcal).toLocaleString(LOCALE)} kcal</span>
          </p>
        </div>
      </div>
    </section>
  );
}
