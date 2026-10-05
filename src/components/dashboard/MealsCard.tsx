"use client";

import { Apple, Bookmark, LockKeyhole, Moon, Pencil, Sun, Sunrise, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SlotProgress } from "@/hooks/useDailyProgress";
import { LOCALE } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/labels";
import type { MealDTO, MealSlot } from "@/types/meal";
import type { Macros, MealItem } from "@/types/nutrition";
import DashCard from "../ui/DashCard";
import EmptyState from "../ui/EmptyState";
import MealThumb from "../ui/MealThumb";
import { EASE_OUT, SPRING } from "../ui/motion";

interface Props {
  index: number;
  status: "loading" | "guest" | "user";
  loading: boolean;
  error: string | null;
  slots: SlotProgress[];
  /** "Yiyecek ekle" in an empty slot: select that slot in the quick-add card. */
  onPick: (slot: MealSlot) => void;
  onEdit: (meal: MealDTO) => void;
  onSaveTemplate: (meal: MealDTO) => void;
  onDeleteMeal: (meal: MealDTO) => void;
  onDeleteItem: (meal: MealDTO, index: number) => void;
  onClearDay: () => void;
  onRegister: () => void;
  onLogin: () => void;
}

const SLOT_ICON: Record<MealSlot, typeof Sun> = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple };
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);
const time = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });

/**
 * "Öğünler": the day by slot. Each slot shows its icon, first log time, kcal against its share,
 * a protein/carb/fat energy strip, and the components of every meal. New rows slide in with a
 * lime flash, deleted ones slide out; empty slots offer "Yiyecek ekle".
 */
export default function MealsCard(p: Props) {
  const itemCount = p.slots.reduce((n, s) => n + s.meals.reduce((m, meal) => m + Math.max(1, meal.items.length), 0), 0);
  const mealCount = p.slots.reduce((n, s) => n + s.meals.length, 0);

  return (
    <DashCard
      index={p.index}
      id="meals-heading"
      eyebrow="Tabak"
      title="Öğünler"
      aside={
        p.status === "user" && mealCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold tabular-nums">{itemCount} kalem</span>
            <button type="button" onClick={p.onClearDay} className="btn btn-ghost-danger h-8 px-3 text-xs">
              <Trash2 aria-hidden className="size-4" /> Günü temizle
            </button>
          </div>
        ) : undefined
      }
    >
      {p.status === "guest" ? (
        <EmptyState
          icon={<LockKeyhole />}
          title="Öğünlerini kaydetmek için giriş yap"
          description="Fotoğraf yükleyip kalorileri hesaplatmak ve günlüğünü tutmak için ücretsiz bir hesap aç."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={p.onRegister} className="btn btn-primary">
                Kayıt Ol
              </button>
              <button type="button" onClick={p.onLogin} className="btn btn-secondary">
                Giriş Yap
              </button>
            </div>
          }
        />
      ) : p.error ? (
        <p role="alert" className="alert alert-danger">
          {p.error}
        </p>
      ) : p.loading || p.status === "loading" ? (
        <div aria-hidden className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton size-10 rounded-[12px]" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {p.slots.map((slot) => (
            <SlotBlock key={slot.slot} slot={slot} {...p} />
          ))}
        </div>
      )}
    </DashCard>
  );
}

function SlotBlock({ slot, onPick, onEdit, onSaveTemplate, onDeleteMeal, onDeleteItem }: Props & { slot: SlotProgress }) {
  const Icon = SLOT_ICON[slot.slot];

  return (
    <motion.article whileHover="hover" className="border-t border-border py-4 first:border-t-0 first:pt-1 last:pb-0">
      <header className="flex items-center gap-3">
        <motion.span
          variants={{ hover: { rotate: -8, scale: 1.06 } }}
          transition={SPRING}
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-ink text-cta"
        >
          <Icon className="size-5" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] leading-tight">{SLOT_LABELS[slot.slot]}</h3>
          <span className="text-xs text-fg-subtle tabular-nums">{slot.firstLoggedAt ? time(slot.firstLoggedAt) : "Henüz eklenmedi"}</span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap tabular-nums ${
            slot.over ? "border-danger bg-danger-soft text-danger-text" : "border-border bg-surface-2"
          }`}
        >
          {fmt(slot.calories)} <small className="font-medium text-fg-muted">{slot.goal !== null ? `/ ${fmt(slot.goal)} kcal` : "kcal"}</small>
        </span>
      </header>

      {slot.meals.length > 0 ? (
        <>
          <div aria-hidden className="mt-3 mb-1.5 ml-[52px] flex h-1.5 gap-0.5 overflow-hidden rounded-full">
            {[
              { w: slot.energyShare.protein, c: "bg-macro-protein" },
              { w: slot.energyShare.carbs, c: "bg-macro-carbs" },
              { w: slot.energyShare.fat, c: "bg-macro-fat" },
            ].map((s, i) => (
              <motion.span
                key={i}
                className={`h-full origin-left rounded-full ${s.c}`}
                style={{ width: `${s.w * 100}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: EASE_OUT, delay: 0.5 }}
              />
            ))}
          </div>
          <div className="ml-[52px] space-y-2">
            {slot.entries.map(({ meal, items }) => (
              <MealBlock
                key={meal.id}
                meal={meal}
                items={items}
                onEdit={() => onEdit(meal)}
                onSaveTemplate={() => onSaveTemplate(meal)}
                onDelete={() => onDeleteMeal(meal)}
                onDeleteItem={(i) => onDeleteItem(meal, i)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 ml-[52px] flex flex-wrap items-center justify-between gap-3 rounded-[14px] border-[1.5px] border-dashed border-border-strong px-4 py-3 text-sm text-fg-muted">
          <p>{SLOT_LABELS[slot.slot]} için henüz bir şey eklenmedi.</p>
          <button
            type="button"
            onClick={() => onPick(slot.slot)}
            className="btn h-8 rounded-full border border-ink px-3.5 text-[13px] text-fg hover:bg-ink hover:text-on-ink"
          >
            Yiyecek ekle
          </button>
        </div>
      )}
    </motion.article>
  );
}

interface MealBlockProps {
  meal: MealDTO;
  items: (MealItem & { macros: Macros })[];
  onEdit: () => void;
  onSaveTemplate: () => void;
  onDelete: () => void;
  onDeleteItem: (index: number) => void;
}

const iconBtn = "btn btn-ghost size-7 px-0";

function MealBlock({ meal, items, onEdit, onSaveTemplate, onDelete, onDeleteItem }: MealBlockProps) {
  return (
    <div>
      <div className="flex items-center gap-2 pt-1">
        <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={24} />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-fg-muted">
          {meal.name} · {time(meal.createdAt)}
        </p>
        <button type="button" onClick={onEdit} aria-label={`${meal.name} öğününü düzenle`} className={iconBtn}>
          <Pencil aria-hidden className="size-3.5" />
        </button>
        <button type="button" onClick={onSaveTemplate} aria-label={`${meal.name} öğününü kaydet`} className={iconBtn}>
          <Bookmark aria-hidden className="size-3.5" />
        </button>
        <button type="button" onClick={onDelete} aria-label={`${meal.name} öğününü sil`} className={`${iconBtn} hover:text-danger-text`}>
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-1.5 text-[13px] text-fg-muted tabular-nums">
          {fmt(meal.calories)} kcal · P {fmt(meal.protein)} · K {fmt(meal.carbs)} · Y {fmt(meal.fat)}
        </p>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const m = item.macros;
              return (
                <motion.li
                  key={`${meal.id}-${item.name}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -16, backgroundColor: "color-mix(in srgb, var(--cta) 22%, transparent)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "color-mix(in srgb, var(--cta) 0%, transparent)" }}
                  exit={{ opacity: 0, x: 24, scale: 0.97, transition: { duration: 0.32, ease: EASE_OUT } }}
                  transition={{ duration: 0.7, ease: EASE_OUT, backgroundColor: { duration: 1.4 } }}
                  className="group -mx-2.5 grid grid-cols-[minmax(0,1fr)_auto_28px] items-center gap-3 rounded-[12px] py-2 pr-2 pl-2.5 hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold">{item.name}</p>
                    <p className="text-xs text-fg-subtle tabular-nums">
                      {fmt(item.grams)} g · P {fmt(m.protein)} · K {fmt(m.carbs)} · Y {fmt(m.fat)}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums">{fmt(m.calories)}</span>
                  <motion.button
                    type="button"
                    onClick={() => onDeleteItem(i)}
                    aria-label={`${item.name} öğesini sil`}
                    whileHover={{ rotate: 90 }}
                    transition={SPRING}
                    className="flex size-7 cursor-pointer items-center justify-center rounded-[9px] text-fg-subtle outline-none hover:bg-danger-soft hover:text-danger-text focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X aria-hidden className="size-3.5" />
                  </motion.button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
