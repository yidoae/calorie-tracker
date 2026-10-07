"use client";

import { Check, Loader2, ScanBarcode, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useMealReview } from "@/hooks/useMealReview";
import { slotForHour } from "@/lib/nutrition/slots";
import type { CreateMealInput, MealDraft } from "@/types/meal";
import MealItemsEditor from "./MealItemsEditor";

interface Props {
  /** The photo, for photo meals; barcode meals have none. */
  image?: Blob;
  draft: MealDraft;
  saving: boolean;
  onSave: (meal: CreateMealInput) => void;
  onDiscard: () => void;
  title?: string;
  subtitle?: string;
  /** Start with empty gram fields the user must fill (a scanned product: amount eaten unknown). */
  askGrams?: boolean;
}

/**
 * A proposed meal before logging (a photo's breakdown or a scanned product): every component with
 * its own portion slider and presets, the slot, and live totals.
 */
export default function MealReview({ image, draft, saving, onSave, onDiscard, title = "Tabağını kontrol et", subtitle, askGrams = false }: Props) {
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  // The slot follows the time the review opened; the user can change it.
  const [initialSlot] = useState(() => slotForHour(new Date().getHours()));
  const review = useMealReview(draft, initialSlot, { askGrams });

  return (
    <div className="card space-y-4 p-4 sm:p-6">
      <div className="flex items-start gap-4">
        {previewUrl ? (
          <Image src={previewUrl} alt="" width={72} height={72} unoptimized className="size-[72px] shrink-0 rounded-[10px] object-cover ring-1 ring-border" />
        ) : (
          <span aria-hidden className="flex size-[72px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-fg-muted ring-1 ring-border">
            <ScanBarcode className="size-8" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="card-title">{title}</h2>
          <p className="mt-1 text-xs text-fg-muted">
            {subtitle ?? `${draft.items.length} bileşen bulduk. Porsiyonu kaydırarak ya da tek dokunuşla düzelt.`}
          </p>
        </div>
      </div>

      <MealItemsEditor review={review} idPrefix="review" />

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
