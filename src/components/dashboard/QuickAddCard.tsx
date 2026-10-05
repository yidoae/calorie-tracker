"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { useQuickAdd } from "@/hooks/useQuickAdd";
import { LOCALE } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/labels";
import { MEAL_SLOTS } from "@/types/meal";
import DashCard from "../ui/DashCard";
import { EASE_OUT, SPRING } from "../ui/motion";

type QuickAdd = ReturnType<typeof useQuickAdd>;

const SHORT = { breakfast: "Kahvaltı", lunch: "Öğle", dinner: "Akşam", snack: "Ara" } as const;
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/**
 * "Hızlı ekle": pick the slot (a lime pill slides between them), search the food database and
 * add one portion with a tap; a "+kcal" floats up from the button.
 */
export default function QuickAddCard({ quick, index }: { quick: QuickAdd; index: number }) {
  return (
    <DashCard index={index} id="quickadd-heading" eyebrow="Yiyecek" title="Hızlı ekle" highlight={quick.highlight}>
      <div role="group" aria-label="Hangi öğüne eklensin" className="mb-3 grid grid-cols-4 gap-1 rounded-[13px] bg-surface-2 p-1">
        {MEAL_SLOTS.map((slot) => {
          const active = quick.slot === slot;
          return (
            <button
              key={slot}
              type="button"
              aria-pressed={active}
              aria-label={SLOT_LABELS[slot]}
              onClick={() => quick.setSlot(slot)}
              className={`relative cursor-pointer rounded-[9px] px-0.5 py-2 text-[13px] font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring ${
                active ? "text-cta-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              {active && <motion.span layoutId="quick-slot" transition={{ type: "spring", stiffness: 380, damping: 26 }} className="absolute inset-0 rounded-[9px] bg-cta" />}
              <span className="relative">{SHORT[slot]}</span>
            </button>
          );
        })}
      </div>

      <label className="relative mb-2 block">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
        <input
          type="search"
          value={quick.query}
          onChange={(e) => quick.setQuery(e.target.value)}
          placeholder="Yiyecek ara"
          autoComplete="off"
          aria-label="Yiyecek ara"
          className="input pl-9"
        />
      </label>

      <div className="-mx-1.5 max-h-80 overflow-y-auto px-1.5 [scrollbar-width:thin]">
        {quick.results.length === 0 ? (
          <p className="px-2.5 py-3.5 text-sm text-fg-muted">
            &ldquo;{quick.query}&rdquo; listede yok. Üstteki yazı kutusuna yazarsan yapay zekâ en yakın besini bulur.
          </p>
        ) : (
          quick.results.map(({ food, kcal }) => (
            <motion.button
              key={food.id}
              type="button"
              onClick={() => quick.add(food)}
              disabled={quick.adding !== null}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="relative grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_30px] items-center gap-2.5 rounded-[14px] border border-transparent py-2 pr-2 pl-2.5 text-left outline-none transition-colors duration-200 hover:border-border hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{food.name}</span>
                <span className="text-xs text-fg-subtle">{fmt(food.portion)} g</span>
              </span>
              <span className="text-[12.5px] text-fg-muted tabular-nums">{fmt(kcal)} kcal</span>
              <motion.span
                aria-hidden
                variants={{ hover: { rotate: 90, scale: 1.08 } }}
                transition={SPRING}
                className="flex size-[30px] items-center justify-center rounded-full bg-cta text-cta-fg"
              >
                {quick.adding === food.id ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" strokeWidth={2.6} />}
              </motion.span>
              <AnimatePresence>
                {quick.lastAdded?.foodId === food.id && (
                  <motion.span
                    key={quick.lastAdded.key}
                    aria-hidden
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -48, scale: 1.25 }}
                    transition={{ duration: 1, ease: EASE_OUT }}
                    className="pointer-events-none absolute -top-1 right-2 font-display text-sm text-success-text"
                  >
                    +{fmt(quick.lastAdded.kcal)}
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="sr-only">{`, ${SLOT_LABELS[quick.slot]} öğününe ekle`}</span>
            </motion.button>
          ))
        )}
      </div>
    </DashCard>
  );
}
