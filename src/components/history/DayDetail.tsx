"use client";

import { CalendarX2, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { LOCALE } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/labels";
import { sumMacros } from "@/lib/nutrition/macros";
import type { MealDTO } from "@/types/meal";
import { MACRO_KEYS, type Macros } from "@/types/nutrition";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";
import MacroBar from "../ui/MacroBar";
import MealThumb from "../ui/MealThumb";

interface Props {
  meals: MealDTO[];
  targets: Macros;
  onEdit: (meal: MealDTO) => void;
  onDelete: (meal: MealDTO) => void;
  onClearDay: (ids: string[]) => void;
}

/** One day's totals against the targets, plus a compact list of its meals. */
export default function DayDetail({ meals, targets, onEdit, onDelete, onClearDay }: Props) {
  const confirmMeal = useConfirm<MealDTO>();
  const confirmClear = useConfirm<string[]>();

  if (meals.length === 0) {
    return <EmptyState icon={<CalendarX2 />} title="Kayıt yok" description="Bu gün hiç öğün kaydedilmemiş." className="py-8" />;
  }

  const totals = sumMacros(meals);
  // The API returns newest first; read the day chronologically.
  const chronological = [...meals].reverse();

  return (
    <div className="space-y-5">
      <section aria-label="Toplamlar" className="space-y-3.5">
        {MACRO_KEYS.map((macro) => (
          <MacroBar key={macro} macro={macro} value={totals[macro]} goal={targets[macro]} mode={macro === "protein" ? "min" : "max"} />
        ))}
      </section>

      <section aria-label="Öğünler" className="border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="section-title">
            Öğünler <span className="text-fg-subtle tabular-nums">{meals.length}</span>
          </h4>
          <button type="button" onClick={() => confirmClear.ask(meals.map((m) => m.id))} className="btn btn-ghost-danger h-7 px-2 text-xs">
            <Trash2 aria-hidden className="size-3.5" /> Günü temizle
          </button>
        </div>
        <ul className="-mx-2 space-y-0.5">
          {chronological.map((meal) => (
            <li key={meal.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2">
              <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-fg">{meal.name}</p>
                <p className="truncate text-xs text-fg-subtle tabular-nums">
                  <span className="font-semibold text-fg">{meal.calories} kcal</span>
                  {meal.name !== SLOT_LABELS[meal.slot] && ` · ${SLOT_LABELS[meal.slot]}`}
                  {" · "}
                  <time dateTime={meal.createdAt}>{new Date(meal.createdAt).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}</time>
                </p>
              </div>
              {meal.items.length > 0 && (
                <button type="button" aria-label={`${meal.name} öğününü düzenle`} onClick={() => onEdit(meal)} className="btn btn-ghost size-7 px-0">
                  <Pencil aria-hidden className="size-3.5" />
                </button>
              )}
              <button type="button" aria-label={`${meal.name} öğününü sil`} onClick={() => confirmMeal.ask(meal)} className="btn btn-ghost-danger size-7 px-0">
                <Trash2 aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={confirmMeal.open}
        title="Bu öğün silinsin mi?"
        message={confirmMeal.target ? `"${confirmMeal.target.name}" bu günün kaydından silinecek. Bu işlem geri alınamaz.` : ""}
        onConfirm={() => confirmMeal.confirm(onDelete)}
        onCancel={confirmMeal.cancel}
      />
      <ConfirmDialog
        open={confirmClear.open}
        title="Bu gün temizlensin mi?"
        message={`Bu gün kaydedilen ${meals.length} öğünün tamamı silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Günü temizle"
        onConfirm={() => confirmClear.confirm(onClearDay)}
        onCancel={confirmClear.cancel}
      />
    </div>
  );
}
