"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, type MotionValue, type Variants } from "motion/react";
import { useStoryPlayer } from "@/hooks/useStoryPlayer";
import { EASE_WIPE, SPRING_SCENE } from "../ui/motion";
import type { Legend } from "./legends";

const STORY_MS = 9000;
/** Horizontal swipe distance (px) that changes the story on touch screens. */
const SWIPE_PX = 48;

const line: Variants = {
  hidden: { opacity: 0, y: 32 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.15 + i * 0.07 } }),
  gone: { opacity: 0, y: -24, transition: { duration: 0.22, ease: "easeIn" } },
};

const monogram: Variants = {
  hidden: { opacity: 0, x: 120 },
  shown: { opacity: 1, x: 0, transition: { ...SPRING_SCENE, delay: 0.1 } },
  gone: { opacity: 0, x: -60, transition: { duration: 0.22, ease: "easeIn" } },
};

/**
 * Scene 2: one athlete per screen, Instagram-style. Progress bars on top, a lime band sweeps
 * across on every change, the story rises line by line. Press (or focus) to hold, swipe or use
 * the arrows to move, and the pause button stops it for good.
 */
export default function LegendStories({ legends }: { legends: Legend[] }) {
  const player = useStoryPlayer(legends.length, STORY_MS);
  const legend = legends[player.index];
  if (!legend) return null;

  return (
    <section
      id="efsaneler"
      aria-roledescription="döngü"
      aria-labelledby="legends-heading"
      onFocus={(e) => player.hold(e.target.matches(":focus-visible"))}
      onBlur={() => player.hold(false)}
      className="relative flex min-h-svh flex-col overflow-hidden border-t border-ink-2"
    >
      <div className="relative z-30 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="flex items-center gap-4">
          <h2 id="legends-heading" className="text-xs font-semibold tracking-[0.05em] text-cta uppercase">
            Efsanelerden
          </h2>
          <p aria-hidden className="font-display text-sm text-on-ink-muted tabular-nums">
            {String(player.index + 1).padStart(2, "0")} / {String(legends.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={player.toggleStopped}
            aria-label={player.stopped ? "Hikâyeleri otomatik oynat" : "Otomatik geçişi durdur"}
            className="btn btn-icon-sm ml-auto text-on-ink-muted hover:text-on-ink focus-visible:ring-offset-ink"
          >
            {player.stopped ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
          </button>
        </div>
        <div aria-hidden className="mt-4 flex gap-1.5">
          {legends.map((l, i) => (
            <ProgressBar key={l.id} value={i === player.index ? player.progress : i < player.index ? 1 : 0} />
          ))}
        </div>
      </div>

      <motion.div
        onPointerDown={() => player.hold(true)}
        onPointerUp={() => player.hold(false)}
        onPointerCancel={() => player.hold(false)}
        onPanEnd={(_, info) => {
          if (info.offset.x <= -SWIPE_PX) player.next();
          else if (info.offset.x >= SWIPE_PX) player.previous();
        }}
        className="relative flex flex-1 touch-pan-y items-center"
      >
        <motion.div
          key={`sweep-${player.index}`}
          aria-hidden
          initial={{ x: "-150%", skewX: -12 }}
          animate={{ x: "900%" }}
          transition={{ duration: 0.8, ease: EASE_WIPE }}
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/6 bg-cta"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={legend.id}
            initial="hidden"
            animate="shown"
            exit="gone"
            aria-roledescription="slayt"
            aria-label={`${player.index + 1} / ${legends.length}: ${legend.name}`}
            aria-live={player.stopped ? "polite" : "off"}
            className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6"
          >
            {/* The wrapper owns position and opacity per breakpoint; the inner span animates. */}
            <span
              aria-hidden
              className="pointer-events-none absolute right-0 -bottom-6 font-display text-[11rem] leading-none text-transparent opacity-20 select-none [-webkit-text-stroke:2px_var(--cta)] sm:text-[16rem] lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:text-[26rem] lg:opacity-100"
            >
              <motion.span variants={monogram} className="block">
                {legend.initials}
              </motion.span>
            </span>

            <div className="relative max-w-3xl">
              <motion.p custom={0} variants={line} className="text-sm font-semibold text-cta">
                {legend.discipline} · {legend.title}
              </motion.p>
              <motion.h3 custom={1} variants={line} className="mt-3 font-display text-5xl leading-[1.02] sm:text-7xl">
                {legend.name}
              </motion.h3>
              <motion.p custom={2} variants={line} className="mt-6 max-w-2xl text-base leading-relaxed text-on-ink-muted sm:text-lg">
                {legend.anecdote}
              </motion.p>
              {legend.quote && (
                <motion.figure custom={3} variants={line} className="mt-8 border-l-4 border-cta pl-4 sm:pl-6">
                  <blockquote className="font-display text-xl leading-snug sm:text-3xl">&ldquo;{legend.quote.tr}&rdquo;</blockquote>
                  <p lang="en" className="mt-2 text-[13px] text-on-ink-muted italic">
                    {legend.quote.original}
                  </p>
                </motion.figure>
              )}
              <motion.p custom={4} variants={line} className="mt-6 text-xs text-on-ink-muted">
                Kaynak: {legend.source}
              </motion.p>
              <motion.p custom={5} variants={line} className="mt-4 flex max-w-2xl items-start gap-2 text-sm text-on-ink">
                <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-cta" />
                {legend.inApp}
              </motion.p>
            </div>
          </motion.article>
        </AnimatePresence>
      </motion.div>

      <div className="relative z-30 mx-auto flex w-full max-w-7xl items-center gap-3 px-4 pb-4 sm:px-6">
        <button type="button" onClick={player.previous} aria-label="Önceki hikâye" className="btn btn-on-ink btn-icon size-11 rounded-full">
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button type="button" onClick={player.next} aria-label="Sonraki hikâye" className="btn btn-on-ink btn-icon size-11 rounded-full">
          <ChevronRight aria-hidden className="size-5" />
        </button>
        <ul className="ml-4 hidden flex-wrap gap-x-5 gap-y-1 lg:flex">
          {legends.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => player.goTo(i)}
                aria-current={i === player.index}
                className={`cursor-pointer rounded-[4px] text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                  i === player.index ? "font-semibold text-cta" : "text-on-ink-muted hover:text-on-ink"
                }`}
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative z-30 mx-auto w-full max-w-7xl px-4 pb-6 text-[11px] text-on-ink-muted sm:px-6 sm:pb-10">
        Anekdotlar ve sözler kamuya açık belgesel, röportaj ve biyografilerden derlenmiştir; çeviriler bize aittir. Bu sporcuların uygulamayla bir bağlantısı
        yoktur.
      </p>
    </section>
  );
}

function ProgressBar({ value }: { value: MotionValue<number> | number }) {
  return (
    <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink-2">
      <motion.span style={{ scaleX: value }} className="block h-full origin-left bg-cta" />
    </span>
  );
}
