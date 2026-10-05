"use client";

import { Check, Loader2 } from "lucide-react";
import { useId } from "react";
import { useMealReview } from "@/hooks/useMealReview";
import type { MealDTO, UpdateMealInput } from "@/types/meal";
import Dialog from "../ui/Dialog";
import MealItemsEditor from "./MealItemsEditor";

interface Props {
  meal: MealDTO | null;
  saving: boolean;
  onSave: (input: UpdateMealInput) => void;
  onClose: () => void;
}

/** Edit a logged meal: rename, move to another slot, change portions or drop components. */
export default function MealEditDialog({ meal, saving, onSave, onClose }: Props) {
  const titleId = useId();
  return (
    <Dialog open={meal !== null} onClose={onClose} labelledBy={titleId} className="max-w-lg">
      {/* Keyed by meal so the editor starts from that meal's values each time it opens. */}
      {meal && <EditBody key={meal.id} meal={meal} titleId={titleId} saving={saving} onSave={onSave} onClose={onClose} />}
    </Dialog>
  );
}

function EditBody({ meal, titleId, saving, onSave, onClose }: { meal: MealDTO; titleId: string } & Omit<Props, "meal">) {
  const review = useMealReview({ name: meal.name, items: meal.items }, meal.slot);
  return (
    <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
      <h2 id={titleId} className="mb-4 font-display text-lg">
        Öğünü düzenle
      </h2>
      {meal.items.length === 0 ? (
        <p className="alert alert-warning">Bu öğün bileşen ayrıntısı olmadan kaydedilmiş; düzenlenemez.</p>
      ) : (
        <MealItemsEditor review={review} idPrefix={`edit-${meal.id}`} />
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" data-autofocus onClick={onClose} disabled={saving} className="btn btn-secondary">
          Vazgeç
        </button>
        <button type="button" disabled={!review.valid || saving || meal.items.length === 0} onClick={() => onSave(review.toMeal())} className="btn btn-primary">
          {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
          {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
      </div>
    </div>
  );
}
