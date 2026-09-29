"use client";

import { Check, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { PORTION_RANGE, PORTION_STEPS, useMealReview } from "@/hooks/useMealReview";
import { LOCALE } from "@/lib/dates";
import type { CreateMealInput, MealDraft } from "@/types/meal";
import CategoryChip from "../ui/CategoryChip";
import PortionControl from "../ui/PortionControl";

interface Props {
  image: Blob;
  draft: MealDraft;
  saving: boolean;
  onSave: (meal: CreateMealInput) => void;
  onDiscard: () => void;
}

const fmt = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });

/**
 * The photo's breakdown before logging: every component (protein source, carbs, sauce/oil…) with
 * its own portion slider and presets. Totals update live.
 */
export default function MealReview({ image, draft, saving, onSave, onDiscard }: Props) {
  const previewUrl = useMemo(() => URL.createObjectURL(image), [image]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
  const review = useMealReview(draft);

  return (
    <div className="card space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <Image src={previewUrl} alt="" width={72} height={72} unoptimized className="size-[72px] shrink-0 rounded-[10px] object-cover ring-1 ring-border" />
        <div className="min-w-0 flex-1">
          <h2 className="card-title">Tabağını kontrol et</h2>
          <p className="mt-1 text-xs text-fg-muted">
            {draft.items.length} bileşen bulduk. Porsiyonu kaydırarak ya da tek dokunuşla düzelt.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="review-name" className="label">
          Öğün adı
        </label>
        <input
          id="review-name"
          value={review.name}
          onChange={(e) => review.setName(e.target.value)}
          aria-invalid={review.name.trim().length === 0}
          className="input"
        />
      </div>

      <ul aria-label="Tabaktaki bileşenler" className="space-y-3">
        {review.rows.map((row) => (
          <li key={row.index} className="animate-enter rounded-[10px] border border-border bg-surface-2 p-3">
            <div className="mb-3 flex items-center gap-2">
              <CategoryChip category={row.item.category} />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{row.item.name}</p>
              <span className="shrink-0 font-display text-sm tabular-nums">{row.macros.calories} kcal</span>
              <button
                type="button"
                aria-label={`${row.item.name} bileşenini çıkar`}
                onClick={() => review.remove(row.index)}
                className="btn btn-ghost-danger btn-icon-sm"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <PortionControl
              id={`portion-${row.index}`}
              label={row.item.name}
              factor={row.factor}
              grams={row.item.grams}
              steps={PORTION_STEPS}
              range={PORTION_RANGE}
              onChange={(f) => review.setFactor(row.index, f)}
            />
            <p className="mt-2 text-xs text-fg-muted tabular-nums">
              P {fmt(row.macros.protein)} g · K {fmt(row.macros.carbs)} g · Y {fmt(row.macros.fat)} g
            </p>
          </li>
        ))}
      </ul>

      {review.removedCount > 0 && (
        <button type="button" onClick={review.restoreAll} className="link inline-flex items-center gap-1 text-xs">
          <RotateCcw aria-hidden className="size-3" /> Çıkarılan {review.removedCount} bileşeni geri al
        </button>
      )}

      <dl aria-live="polite" className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
        {(
          [
            ["Kalori", fmt(review.totals.calories), "kcal"],
            ["Protein", fmt(review.totals.protein), "g"],
            ["Karbonhidrat", fmt(review.totals.carbs), "g"],
            ["Yağ", fmt(review.totals.fat), "g"],
          ] as const
        ).map(([label, value, unit]) => (
          <div key={label} className="tile">
            <dt className="tile-label">{label}</dt>
            <dd className="tile-value">
              {value}
              <span className="ml-1 text-xs font-normal text-fg-subtle">{unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2 border-t border-border pt-4">
        <button type="button" onClick={onDiscard} disabled={saving} className="btn btn-secondary flex-1">
          <Trash2 aria-hidden className="size-4" /> Vazgeç
        </button>
        <button type="button" disabled={!review.valid || saving} onClick={() => onSave(review.toMeal())} className="btn btn-primary flex-1">
          {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
          {saving ? "Kaydediliyor…" : "Günlüğe kaydet"}
        </button>
      </div>
    </div>
  );
}
