"use client";

import { Loader2, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { useQuickAdd } from "@/hooks/useQuickAdd";
import { LOCALE } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/labels";
import { MEAL_SLOTS } from "@/types/meal";
import CustomFoodDialog from "../meals/CustomFoodDialog";
import DashCard from "../ui/DashCard";
import { EASE_OUT, SPRING } from "../ui/motion";

type QuickAdd = ReturnType<typeof useQuickAdd>;

const SHORT = { breakfast: "Kahvaltı", lunch: "Öğle", dinner: "Akşam", snack: "Ara" } as const;
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/**
 * "Hızlı ekle": pick the slot (a lime pill slides between them), search the food database and the
 * user's own foods, tap one and type the grams eaten; a "+kcal" floats up after adding. Anything
 * not listed is added with "Kendi ürününü ekle" (typed or read from the pack's label).
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
          <div className="space-y-3 px-2.5 py-3.5">
            <p className="text-sm text-fg-muted">&ldquo;{quick.query}&rdquo; listede yok. Paketteki besin tablosundan kendin ekleyebilirsin.</p>
            <button type="button" onClick={quick.openCustom} className="btn btn-primary w-full">
              <PackagePlus aria-hidden className="size-4" />
              Kendi ürününü ekle
            </button>
          </div>
        ) : (
          quick.results.map((food) => {
            const open = quick.selected?.key === food.key;
            return (
              <div key={food.key} className={`relative rounded-[14px] border ${open ? "border-border bg-surface-2" : "border-transparent"}`}>
                <motion.button
                  type="button"
                  onClick={() => quick.select(food.key)}
                  aria-expanded={open}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_30px] items-center gap-2.5 rounded-[14px] py-2 pr-2 pl-2.5 text-left outline-none transition-colors duration-200 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{food.name}</span>
                      {food.customId && <span className="badge shrink-0 bg-cta text-cta-fg">Senin</span>}
                    </span>
                    <span className="text-xs text-fg-subtle">100 g</span>
                  </span>
                  <span className="text-[12.5px] text-fg-muted tabular-nums">{fmt(food.per100g.calories)} kcal</span>
                  <motion.span
                    aria-hidden
                    variants={{ hover: { rotate: 90, scale: 1.08 } }}
                    transition={SPRING}
                    className="flex size-[30px] items-center justify-center rounded-full bg-cta text-cta-fg"
                  >
                    <Plus className="size-3.5" strokeWidth={2.6} />
                  </motion.span>
                  <span className="sr-only">{open ? ", gram alanını kapat" : ", gram girip ekle"}</span>
                </motion.button>

                {open && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      quick.add();
                    }}
                    className="space-y-2 px-2.5 pb-2.5"
                  >
                    <div className="flex gap-2">
                      <label htmlFor={`grams-${food.key}`} className="sr-only">
                        {food.name}: kaç gram yedin
                      </label>
                      <input
                        id={`grams-${food.key}`}
                        // The field opens because the user tapped the food; focusing it is expected.
                        autoFocus
                        value={quick.gramText}
                        onChange={(e) => quick.setGramText(e.target.value)}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Kaç gram?"
                        className="input"
                      />
                      <button type="submit" disabled={!quick.gramsValid || quick.adding} className="btn btn-primary h-10 shrink-0">
                        {quick.adding ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Plus aria-hidden className="size-4" />}
                        Ekle
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
                      <span className="tabular-nums" aria-live="polite">
                        {quick.previewKcal !== null ? `= ${fmt(quick.previewKcal)} kcal · ${SLOT_LABELS[quick.slot]}` : food.portion ? `1 porsiyon ≈ ${fmt(food.portion)} g` : "Gram olarak yaz"}
                      </span>
                      {food.customId && (
                        <button type="button" onClick={() => quick.removeCustom(food)} className="link inline-flex items-center gap-1 text-danger-text">
                          <Trash2 aria-hidden className="size-3" /> Ürünü sil
                        </button>
                      )}
                    </div>
                  </form>
                )}

                <AnimatePresence>
                  {quick.lastAdded?.foodKey === food.key && (
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
              </div>
            );
          })
        )}
      </div>

      {quick.results.length > 0 && (
        <button type="button" onClick={quick.openCustom} className="link mt-3 inline-flex items-center gap-1.5 text-[13px]">
          <PackagePlus aria-hidden className="size-4" />
          Listede yok mu? Kendi ürününü ekle
        </button>
      )}

      <CustomFoodDialog open={quick.customOpen} initialName={quick.query} slot={quick.slot} onClose={quick.closeCustom} onSaved={quick.onCustomSaved} />
    </DashCard>
  );
}
