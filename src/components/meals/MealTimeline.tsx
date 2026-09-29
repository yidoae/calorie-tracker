"use client";

import { Camera, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { LOCALE } from "@/lib/dates";
import type { MealDTO } from "@/types/meal";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";
import MealThumb from "../ui/MealThumb";

interface Props {
  meals: MealDTO[];
  onDelete: (meal: MealDTO) => void;
}

const fmt = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });

/** Placeholder rows shown while today's meals load. */
export function MealTimelineSkeleton() {
  return (
    <div aria-busy="true" aria-label="Öğünler yükleniyor" className="card divide-y divide-border">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="skeleton size-12 shrink-0 rounded-[6px]" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Today's meals, newest first, with their components. */
export default function MealTimeline({ meals, onDelete }: Props) {
  const confirm = useConfirm<MealDTO>();

  if (meals.length === 0) {
    return (
      <EmptyState
        icon={<Camera />}
        title="Bugün henüz öğün yok"
        description="Fotoğraf çek ya da hızlı girişe yaz; kalorisini ve makrolarını biz hesaplayalım."
      />
    );
  }

  return (
    <>
      <ol className="card divide-y divide-border overflow-hidden">
        {meals.map((meal) => (
          <li key={meal.id} className="flex animate-enter items-center gap-3 p-3 transition-colors hover:bg-surface-2/60">
            <MealThumb imageUrl={meal.imageUrl} name={meal.name} size={48} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-fg">{meal.name}</h3>
                <span className="shrink-0 font-display text-sm tabular-nums text-fg">
                  {meal.calories} <span className="font-sans text-xs font-normal text-fg-subtle">kcal</span>
                </span>
              </div>
              {meal.items.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-fg-muted">
                  {meal.items.map((i) => `${i.name} ${Math.round(i.grams)} g`).join(" · ")}
                </p>
              )}
              <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-fg-subtle tabular-nums">
                <p className="truncate">
                  P {fmt(meal.protein)}g · K {fmt(meal.carbs)}g · Y {fmt(meal.fat)}g
                </p>
                <time dateTime={meal.createdAt} className="shrink-0">
                  {new Date(meal.createdAt).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
            </div>

            <button type="button" aria-label={`${meal.name} öğününü sil`} onClick={() => confirm.ask(meal)} className="btn btn-icon-sm btn-ghost-danger">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={confirm.open}
        title="Bu öğün silinsin mi?"
        message={confirm.target ? `"${confirm.target.name}" bugünün kaydından silinecek. Bu işlem geri alınamaz.` : ""}
        onConfirm={() => confirm.confirm(onDelete)}
        onCancel={confirm.cancel}
      />
    </>
  );
}
