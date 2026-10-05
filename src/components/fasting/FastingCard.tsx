"use client";

import { Globe, Hourglass, Utensils } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { FastingApi } from "@/hooks/useFasting";
import { formatCountdown, formatDuration, formatMinuteOfDay, MINUTES_PER_DAY, parseMinuteOfDay } from "@/lib/nutrition/fasting";
import { FASTING_PRESETS, type FastingPreset } from "@/types/fasting";
import SensitiveWarningDialog from "../plan/SensitiveWarningDialog";
import Segmented, { type SegmentedItem } from "../ui/Segmented";
import Switch from "../ui/Switch";
import { FADE, SPRING } from "../ui/motion";

const PRESET_ITEMS: SegmentedItem<FastingPreset>[] = FASTING_PRESETS.map((p) => ({ id: p, label: p === "custom" ? "Özel" : p }));

const PHASE = {
  eating: { label: "Yeme penceresi", next: "Oruca kalan", icon: Utensils, badge: "bg-cta text-cta-fg", arc: "var(--cta)" },
  fasting: { label: "Oruç zamanı", next: "Yeme penceresine kalan", icon: Hourglass, badge: "bg-ink text-on-ink", arc: "var(--ink)" },
} as const;

const DIAL = 176;
const R = 76;

/**
 * Intermittent fasting: on/off switch, a 24-hour dial (eating window in lime, fasting in ink, a
 * marker for now), the current phase with a live countdown, and the window controls.
 */
export default function FastingCard({ fasting }: { fasting: FastingApi }) {
  const { config, state } = fasting;
  const on = config.enabled;

  return (
    <section aria-labelledby="fasting-heading" className="card p-4 sm:p-6">
      <h2 id="fasting-heading" className="sr-only">
        Aralıklı oruç
      </h2>
      {fasting.ready ? (
        <Switch
          id="fasting-enabled"
          checked={on}
          onChange={fasting.setEnabled}
          label="Aralıklı oruç"
          description={on ? "Geri sayım yerel saatine göre çalışır." : "Yeme ve oruç pencereni seç, geri sayımı burada izle."}
        />
      ) : (
        <div aria-hidden className="skeleton h-10 w-full" />
      )}

      <AnimatePresence initial={false}>
        {on && state && (
          <motion.div
            key="fasting-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: SPRING }}
            exit={{ opacity: 0, height: 0, transition: FADE }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <Dial eatStart={config.eatStart} eatEnd={config.eatEnd} minuteNow={fasting.minuteNow} progress={state.progress} phase={state.phase} />
              <div className="min-w-0 text-center sm:text-left" aria-live="off">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${PHASE[state.phase].badge}`}>
                  {(() => {
                    const Icon = PHASE[state.phase].icon;
                    return <Icon aria-hidden className="size-3.5" />;
                  })()}
                  {PHASE[state.phase].label}
                </span>
                <p className="mt-3 text-xs text-fg-muted">{PHASE[state.phase].next}</p>
                <p className="font-display text-4xl tabular-nums" role="timer" aria-label={`${PHASE[state.phase].next}: ${formatCountdown(state.remainingMs)}`}>
                  {formatCountdown(state.remainingMs)}
                </p>
                <p className="mt-2 text-[13px] text-fg-muted">
                  Yeme: {formatMinuteOfDay(config.eatStart)}–{formatMinuteOfDay(config.eatEnd)} ({formatDuration(state.eatingMinutes)}) · Oruç:{" "}
                  {formatDuration(state.fastingMinutes)}
                </p>
                {fasting.timeZone && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-fg-subtle sm:justify-start">
                    <Globe aria-hidden className="size-3.5" /> {fasting.timeZone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <Segmented items={PRESET_ITEMS} value={config.preset} onChange={fasting.setPreset} label="Oruç düzeni" idPrefix="fasting" />
              <div id={`fasting-${config.preset}`} role="tabpanel" aria-labelledby={`fasting-tab-${config.preset}`} className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fasting-start" className="label">
                    Yeme başlangıcı
                  </label>
                  <input
                    id="fasting-start"
                    type="time"
                    step={900}
                    value={formatMinuteOfDay(config.eatStart)}
                    onChange={(e) => {
                      const minutes = parseMinuteOfDay(e.target.value);
                      if (minutes !== null) fasting.setStart(minutes);
                    }}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="fasting-end" className="label">
                    Yeme bitişi
                  </label>
                  <input
                    id="fasting-end"
                    type="time"
                    step={900}
                    value={formatMinuteOfDay(config.eatEnd)}
                    readOnly={config.preset !== "custom"}
                    onChange={(e) => {
                      const minutes = parseMinuteOfDay(e.target.value);
                      if (minutes !== null) fasting.setEnd(minutes);
                    }}
                    aria-describedby={config.preset !== "custom" ? "fasting-end-hint" : undefined}
                    className="input read-only:bg-surface-2 read-only:text-fg-muted"
                  />
                  {config.preset !== "custom" && (
                    <p id="fasting-end-hint" className="hint">
                      {config.preset} düzeninde otomatik.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SensitiveWarningDialog warning={fasting.warning} onAccept={fasting.acceptWarning} onDecline={fasting.declineWarning} />
    </section>
  );
}

interface DialProps {
  eatStart: number;
  eatEnd: number;
  /** Minutes after local midnight, for the "now" marker. */
  minuteNow: number;
  progress: number;
  phase: "eating" | "fasting";
}

/** 24-hour dial, midnight at the top: ink fasting ring, lime eating arc, inner ring = phase progress, dot = now. */
function Dial({ eatStart, eatEnd, minuteNow, progress, phase }: DialProps) {
  const eatLength = (((eatEnd - eatStart) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const angle = (minuteNow / MINUTES_PER_DAY) * 2 * Math.PI - Math.PI / 2;
  const c = DIAL / 2;

  return (
    <svg width={DIAL} height={DIAL} viewBox={`0 0 ${DIAL} ${DIAL}`} aria-hidden className="shrink-0">
      <g transform={`rotate(-90 ${c} ${c})`}>
        <circle cx={c} cy={c} r={R} fill="none" stroke="var(--ink)" strokeWidth={12} />
        <circle
          cx={c}
          cy={c}
          r={R}
          fill="none"
          stroke="var(--cta)"
          strokeWidth={12}
          pathLength={MINUTES_PER_DAY}
          strokeDasharray={`${eatLength} ${MINUTES_PER_DAY - eatLength}`}
          strokeDashoffset={-eatStart}
        />
        <circle cx={c} cy={c} r={R - 18} fill="none" stroke="var(--surface-3)" strokeWidth={6} />
        <motion.circle
          cx={c}
          cy={c}
          r={R - 18}
          fill="none"
          stroke={PHASE[phase].arc}
          strokeWidth={6}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </g>
      {[0, 6, 12, 18].map((hour) => {
        const a = (hour / 24) * 2 * Math.PI - Math.PI / 2;
        return (
          <text key={hour} x={c + Math.cos(a) * (R - 34)} y={c + Math.sin(a) * (R - 34)} textAnchor="middle" dominantBaseline="central" className="fill-fg-subtle text-[10px] font-semibold">
            {String(hour).padStart(2, "0")}
          </text>
        );
      })}
      <circle cx={c + Math.cos(angle) * R} cy={c + Math.sin(angle) * R} r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
    </svg>
  );
}
