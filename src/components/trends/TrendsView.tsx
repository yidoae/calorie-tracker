"use client";

import { ArrowLeft, Flame, LockKeyhole, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useIsClient } from "@/hooks/useIsClient";
import { TREND_WINDOWS, useTrends, type TrendWindow } from "@/hooks/useTrends";
import { LOCALE } from "@/lib/dates";
import type { DayRating } from "@/lib/nutrition/dayRating";
import { ROUTES } from "@/lib/routes";
import { MACRO_KEYS } from "@/types/nutrition";
import SiteHeader from "../layout/SiteHeader";
import AnimatedNumber from "../ui/AnimatedNumber";
import CalorieBars, { type CalorieBar } from "../ui/CalorieBars";
import EmptyState from "../ui/EmptyState";
import MacroBar from "../ui/MacroBar";
import Segmented from "../ui/Segmented";

const WINDOW_ITEMS = TREND_WINDOWS.map((d) => ({ id: String(d) as `${TrendWindow}`, label: `${d} gün` }));
const RATING_TEXT: Record<DayRating, string> = { onTarget: "Hedefte", under: "Hedefin altında", over: "Hedefin üstünde" };

/** /gelisim ("Gelişim & Analiz"): streaks, calories against the goal line and macro averages over 7/30/90 days. */
export default function TrendsView() {
  const { status, openAuth } = useAuth();
  const isClient = useIsClient();

  return (
    <>
      <SiteHeader />
      <section className="bg-ink text-on-ink">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-12 sm:px-6">
          <Link href={ROUTES.panel} className="link inline-flex items-center gap-1 text-xs text-on-ink-muted hover:text-on-ink">
            <ArrowLeft aria-hidden className="size-3" /> Ana ekrana dön
          </Link>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl">Gelişim &amp; Analiz</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-ink-muted">Tek bir gün değil, gidişat önemli. Kaydettiğin günlere göre ortalamaların burada.</p>
        </div>
      </section>
      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-6 lg:pt-10">
          {status === "guest" ? (
            <EmptyState
              icon={<LockKeyhole />}
              title="Gelişimini görmek için giriş yap"
              description="Öğün kaydettikçe serilerin, ortalamaların ve hedef uyumun burada birikir."
              action={
                <button type="button" onClick={() => openAuth("login")} className="btn btn-primary">
                  Giriş Yap
                </button>
              }
            />
          ) : isClient && status === "user" ? (
            <Trends />
          ) : (
            <div aria-hidden className="skeleton h-80 w-full" />
          )}
        </div>
      </main>
    </>
  );
}

function Trends() {
  const t = useTrends();
  const bars: CalorieBar[] = t.series.map((d) => ({
    key: d.key,
    label: d.date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" }),
    calories: d.logged ? Math.round(d.totals.calories) : null,
    goal: d.goal.calories,
    status: d.rating ? RATING_TEXT[d.rating] : null,
  }));

  return (
    <div className="space-y-6">
      <Segmented
        items={WINDOW_ITEMS}
        value={String(t.days) as `${TrendWindow}`}
        onChange={(id) => t.setDays(Number(id) as TrendWindow)}
        label="Zaman aralığı"
        idPrefix="trend"
        className="max-w-sm"
      />

      {t.error ? (
        <p role="alert" className="alert alert-danger">
          {t.error}
        </p>
      ) : t.loading ? (
        <div aria-busy="true" aria-label="Yükleniyor" className="space-y-4">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-56 w-full" />
        </div>
      ) : (
        <div id={`trend-${t.days}`} role="tabpanel" aria-labelledby={`trend-tab-${t.days}`} className="space-y-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            {(
              [
                [
                  <Flame key="i" aria-hidden className="size-4" />,
                  "Güncel seri",
                  <>
                    <AnimatedNumber value={t.streak.current} /> gün
                  </>,
                ],
                [
                  <Trophy key="i" aria-hidden className="size-4" />,
                  "En uzun seri",
                  <>
                    <AnimatedNumber value={t.streak.best} /> gün
                  </>,
                ],
                [
                  <Target key="i" aria-hidden className="size-4" />,
                  "Hedefte geçen gün",
                  <>
                    <AnimatedNumber value={t.summary.onTargetDays} /> / {t.summary.loggedDays}
                  </>,
                ],
              ] as const
            ).map(([icon, label, value]) => (
              <div key={label} className="card p-4">
                <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
                  {icon}
                  {label}
                </dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="calorie-trend" className="card p-4 sm:p-6">
            <h2 id="calorie-trend" className="section-title mb-4">
              Kalori ve hedef
            </h2>
            {t.summary.loggedDays === 0 ? <p className="text-[13px] text-fg-subtle">Bu aralıkta kayıtlı gün yok.</p> : <CalorieBars key={t.days} bars={bars} />}
          </section>

          {t.summary.average && t.summary.averageGoal && (
            <section aria-labelledby="macro-avg" className="card p-4 sm:p-6">
              <h2 id="macro-avg" className="section-title mb-1">
                Günlük ortalama
              </h2>
              <p className="mb-4 text-xs text-fg-subtle">Yalnızca kayıt girilen {t.summary.loggedDays} gün üzerinden.</p>
              <div className="space-y-3.5">
                {MACRO_KEYS.map((key) => (
                  <MacroBar key={key} macro={key} value={t.summary.average![key]} goal={t.summary.averageGoal![key]} mode={key === "protein" ? "min" : "max"} />
                ))}
              </div>
            </section>
          )}
          <p className="text-xs text-fg-subtle">Kayıt girmediğin günler sıfır kalori sayılmaz; seriyi bozmak için bir sebep değil, sadece boşluk.</p>
        </div>
      )}
    </div>
  );
}
