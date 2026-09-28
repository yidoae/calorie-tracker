"use client";

import { Check, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export interface MealDraft {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Estimated portion weight, if the analyzer provided one. Editing it scales the macros. */
  grams?: number;
}

export interface ReviewedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  image: Blob;
  draft: MealDraft;
  saving: boolean;
  onSave: (final: ReviewedMeal) => void;
  onDiscard: () => void;
}


/** Lets the user check, edit or discard a vision-model draft before it's logged. */
export default function MealReviewCard({ image, draft, saving, onSave, onDiscard }: Props) {
  const previewUrl = useMemo(() => URL.createObjectURL(image), [image]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const [name, setName] = useState(draft.name);
  const [grams, setGrams] = useState(draft.grams !== undefined ? String(draft.grams) : "");

  const gramsNum = Number(grams);
  const scale = draft.grams && gramsNum > 0 ? gramsNum / draft.grams : 1;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const calories = Math.round(draft.calories * scale);
  const protein = round1(draft.protein * scale);
  const carbs = round1(draft.carbs * scale);
  const fat = round1(draft.fat * scale);

  const gramsValid = draft.grams === undefined || (Number.isFinite(gramsNum) && gramsNum > 0);
  const valid = name.trim().length > 0 && gramsValid;

  return (
    <div className="card space-y-4 p-4">
      <div>
        <h2 className="card-title">Review before logging</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">Check the estimate — edit the name or weight if it&apos;s off.</p>
      </div>

      <div className="flex items-end gap-3">
        <Image
          src={previewUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor="review-name" className="label">
            Meal name
          </label>
          <input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={name.trim().length === 0}
            className="input"
          />
        </div>
      </div>

      {draft.grams !== undefined && (
        <div>
          <label htmlFor="review-grams" className="label">
            Estimated weight (g)
          </label>
          <input
            id="review-grams"
            type="number"
            inputMode="decimal"
            min={1}
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            aria-invalid={!gramsValid}
            aria-describedby="review-grams-hint"
            className="input w-32"
          />
          <p id="review-grams-hint" className="hint">
            Macros scale with the weight.
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
        {(
          [
            ["Calories", `${calories}`, "kcal"],
            ["Protein", `${protein}`, "g"],
            ["Carbs", `${carbs}`, "g"],
            ["Fat", `${fat}`, "g"],
          ] as const
        ).map(([label, value, unit]) => (
          <div key={label} className="tile">
            <dt className="tile-label">{label}</dt>
            <dd className="tile-value">
              {value}
              <span className="ml-0.5 text-xs font-normal text-fg-subtle">{unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2 border-t border-border pt-4">
        <button type="button" onClick={onDiscard} disabled={saving} className="btn btn-secondary flex-1">
          <Trash2 aria-hidden className="size-4" /> Discard
        </button>
        <button
          type="button"
          disabled={!valid || saving}
          onClick={() => onSave({ name: name.trim(), calories, protein, carbs, fat })}
          className="btn btn-primary flex-1"
        >
          {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
          {saving ? "Saving…" : "Save to log"}
        </button>
      </div>
    </div>
  );
}
