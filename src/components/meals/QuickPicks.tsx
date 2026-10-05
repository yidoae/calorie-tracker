"use client";

import { Bookmark, History, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useQuickPicks } from "@/hooks/useQuickPicks";
import { totalOfItems } from "@/lib/nutrition/macros";
import { FADE, SPRING_BOUNCY, staggerDelay } from "../ui/motion";

const chipMotion = (index: number) => ({
  layout: true,
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { ...SPRING_BOUNCY, delay: staggerDelay(index, 0.03) } },
  exit: { opacity: 0, scale: 0.9, transition: FADE },
});

/**
 * "Son yenenler" and "Kayıtlı öğünler" as chips under the quick bar: one tap logs the meal again.
 * Hidden for guests and until there's something to show.
 */
export default function QuickPicks() {
  const q = useQuickPicks();
  if (q.error) return <p className="px-1 text-xs text-danger-text">Son öğünler yüklenemedi.</p>;
  if (q.loading) return <div aria-hidden className="skeleton h-8 w-2/3" />;
  if (q.recent.length === 0 && q.saved.length === 0) return null;

  const chip =
    "flex h-8 max-w-56 min-w-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 text-[13px] outline-none transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:text-fg-subtle";

  return (
    <div className="space-y-3">
      {q.saved.length > 0 && (
        <section aria-labelledby="saved-picks">
          <h3 id="saved-picks" className="section-title mb-2 flex items-center gap-1.5">
            <Bookmark aria-hidden className="size-3.5" /> Kayıtlı öğünler
          </h3>
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {q.saved.map((meal, i) => (
                <motion.li key={meal.id} {...chipMotion(i)} className="flex items-center">
                  <button
                    type="button"
                    disabled={q.busyId !== null}
                    onClick={() => q.logSaved(meal)}
                    aria-label={`${meal.name} öğününü ekle, ${totalOfItems(meal.items).calories} kcal`}
                    className={`${chip} rounded-r-none border-r-0`}
                  >
                    {q.busyId === meal.id ? <Loader2 aria-hidden className="size-3.5 shrink-0 animate-spin" /> : null}
                    <span className="truncate font-medium">{meal.name}</span>
                    <span className="shrink-0 text-fg-subtle tabular-nums">{totalOfItems(meal.items).calories}</span>
                  </button>
                  <button
                    type="button"
                    disabled={q.busyId !== null}
                    onClick={() => void q.removeSaved(meal)}
                    aria-label={`${meal.name} kayıtlı öğünlerden çıkar`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-full border border-border text-fg-subtle outline-none hover:bg-danger-soft hover:text-danger-text focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {q.recent.length > 0 && (
        <section aria-labelledby="recent-picks">
          <h3 id="recent-picks" className="section-title mb-2 flex items-center gap-1.5">
            <History aria-hidden className="size-3.5" /> Son yenenler
          </h3>
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {q.recent.map((meal, i) => (
                <motion.li key={meal.id} {...chipMotion(i)}>
                  <button
                    type="button"
                    disabled={q.busyId !== null}
                    onClick={() => q.logRecent(meal)}
                    aria-label={`${meal.name} öğününü tekrar ekle, ${meal.calories} kcal`}
                    className={chip}
                  >
                    {q.busyId === meal.id ? <Loader2 aria-hidden className="size-3.5 shrink-0 animate-spin" /> : null}
                    <span className="truncate font-medium">{meal.name}</span>
                    <span className="shrink-0 text-fg-subtle tabular-nums">{meal.calories}</span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}
