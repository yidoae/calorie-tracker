"use client";

import { RotateCcw, X } from "lucide-react";
import { PORTION_RANGE, PORTION_STEPS, type useMealReview } from "@/hooks/useMealReview";
import { LOCALE } from "@/lib/dates";
import { SLOT_LABELS } from "@/lib/labels";
import { MEAL_SLOTS } from "@/types/meal";
import type { MealItem } from "@/types/nutrition";
import CategoryChip from "../ui/CategoryChip";
import ChipGroup from "../ui/ChipGroup";
import PortionControl from "../ui/PortionControl";

type Review = ReturnType<typeof useMealReview>;

const fmt = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
const SLOT_OPTIONS = MEAL_SLOTS.map((id) => ({ id, label: SLOT_LABELS[id] }));

/** A photo component's guesses, best first; the user picks the right one. */
export interface ComponentGuesses {
  options: MealItem[];
  picked: number;
  onPick: (index: number) => void;
}

/**
 * The editable body of a meal: name, slot, one card per component with its portion slider, and
 * live totals. Shared by the photo review, the barcode review and the edit dialog. `guesses[i]`
 * (photo meals) adds "Bu mu?" chips to component i.
 */
export default function MealItemsEditor({
  review,
  idPrefix,
  guesses,
  disabled = false,
}: {
  review: Review;
  idPrefix: string;
  guesses?: ComponentGuesses[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="label">
          Öğün adı
        </label>
        <input
          id={`${idPrefix}-name`}
          value={review.name}
          onChange={(e) => review.setName(e.target.value)}
          maxLength={120}
          aria-invalid={review.name.trim().length === 0}
          className="input"
        />
      </div>

      <div>
        <p className="label">Öğün</p>
        <ChipGroup options={SLOT_OPTIONS} value={review.slot} onChange={review.setSlot} label="Öğün" />
      </div>

      <ul aria-label="Bileşenler" className="space-y-3">
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
            {(guesses?.[row.index]?.options.length ?? 0) > 1 && (
              <GuessChips guesses={guesses![row.index]} label={`${row.item.name} doğru mu?`} disabled={disabled} />
            )}
            <PortionControl
              id={`${idPrefix}-portion-${row.index}`}
              label={row.item.name}
              factor={row.factor}
              grams={row.item.grams}
              gramText={row.gramText}
              missing={row.missing}
              steps={PORTION_STEPS}
              range={PORTION_RANGE}
              onChange={(f) => review.setFactor(row.index, f)}
              onGramsChange={(text) => review.setGrams(row.index, text)}
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
    </div>
  );
}

function GuessChips({ guesses, label, disabled }: { guesses: ComponentGuesses; label: string; disabled: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="mb-3 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-fg-muted">Bu mu?</span>
      {guesses.options.map((option, i) => (
        <button
          key={option.name}
          type="button"
          role="radio"
          aria-checked={i === guesses.picked}
          onClick={() => guesses.onPick(i)}
          disabled={disabled}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
            i === guesses.picked ? "border-ink bg-ink text-on-ink" : "border-border bg-surface text-fg hover:border-ink"
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}
