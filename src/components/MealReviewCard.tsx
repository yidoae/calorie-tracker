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

const tile = "rounded-lg bg-white p-2 text-center dark:bg-zinc-900";
const tileLabel = "text-[11px] text-zinc-500 dark:text-zinc-400";

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
    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Review before logging</p>

      <div className="flex items-center gap-3">
        <Image
          src={previewUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor="review-name" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Meal name
          </label>
          <input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {draft.grams !== undefined && (
        <div>
          <label htmlFor="review-grams" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
            className="h-10 w-32 rounded-lg border border-zinc-300 bg-white px-3 text-sm tabular-nums outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Off? Adjust the weight — macros scale with it.</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <div className={tile}>
          <p className={tileLabel}>Calories</p>
          <p className="font-semibold tabular-nums text-orange-600 dark:text-orange-400">{calories}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Protein</p>
          <p className="font-semibold tabular-nums">{protein}g</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Carbs</p>
          <p className="font-semibold tabular-nums">{carbs}g</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Fat</p>
          <p className="font-semibold tabular-nums">{fat}g</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Trash2 className="size-4" /> Discard
        </button>
        <button
          type="button"
          disabled={!valid || saving}
          onClick={() => onSave({ name: name.trim(), calories, protein, carbs, fat })}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saving ? "Saving…" : "Save to log"}
        </button>
      </div>
    </div>
  );
}
