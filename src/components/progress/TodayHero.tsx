import type { RingState } from "@/hooks/useDailyProgress";
import { LOCALE } from "@/lib/dates";
import ProgressRing from "../ui/ProgressRing";

interface Props {
  ring: RingState;
  remaining: number;
  mealCount: number;
  username: string | null;
  dateLabel: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/** The ink band under the nav: today's calories as a large ring, what's left, and the meal count. */
export default function TodayHero({ ring, remaining, mealCount, username, dateLabel }: Props) {
  const over = ring.over;

  return (
    <section aria-labelledby="hero-heading" className="bg-ink text-on-ink">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16">
        <p className="text-xs font-semibold tracking-[0.05em] text-on-ink-muted uppercase">
          {dateLabel}
          {username && <span className="normal-case"> · Merhaba, {username}</span>}
        </p>
        <h1 id="hero-heading" className="sr-only">
          Bugünkü kalori
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-12 gap-y-6">
          <ProgressRing
            progress={ring.progress}
            size={176}
            stroke={14}
            arcClass={over ? "stroke-danger" : "stroke-cta"}
            trackClass="stroke-ink-2"
            reached={ring.reached}
            celebrating={ring.celebrating}
            label="Kalori"
            valueText={`${fmt(ring.value)} / ${fmt(ring.goal)} kcal`}
          >
            <span className="font-display text-4xl leading-none tabular-nums">{fmt(ring.value)}</span>
            <span className="mt-1 text-xs text-on-ink-muted tabular-nums">/ {fmt(ring.goal)} kcal</span>
          </ProgressRing>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:flex sm:gap-12">
            <div>
              <dt className="text-on-ink-muted">{over ? "Hedef aşıldı" : "Bugün kalan"}</dt>
              <dd className={`font-display text-3xl tabular-nums sm:text-4xl ${over ? "text-danger-soft" : "text-cta"}`}>
                {fmt(Math.abs(remaining))} <span className="text-lg">kcal</span>
              </dd>
            </div>
            <div>
              <dt className="text-on-ink-muted">Öğün</dt>
              <dd className="font-display text-3xl tabular-nums sm:text-4xl">{mealCount}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-on-ink-muted">Hedefin</dt>
              <dd className="font-display text-lg tabular-nums">%{Math.round(ring.progress * 100)} tamamlandı</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
