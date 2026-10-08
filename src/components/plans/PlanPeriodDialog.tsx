"use client";

import { CalendarRange, Pencil, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import { findOverlap, rangeLength, type RangeDraft } from "@/lib/nutrition/schedule";
import { PLAN_TITLE_MAX, PLAN_TITLE_SUGGESTIONS, type NutritionPlan, type PlanPeriod } from "@/types/plan";
import Dialog from "../ui/Dialog";
import { formatRange } from "./format";
import RangeCalendar from "./RangeCalendar";

/** What the dialog edits: a saved period, a new period for a freshly built plan, or the main plan's title. */
export type PeriodTarget =
  | { kind: "period"; period: PlanPeriod }
  | { kind: "new"; plan: NutritionPlan; title: string }
  | { kind: "main"; title: string };

interface Props {
  target: PeriodTarget | null;
  periods: PlanPeriod[];
  onSavePeriod: (period: PlanPeriod) => void;
  /** Needed for the "main" target. */
  onSaveMainTitle?: (title: string) => void;
  /** Needed for the "period" target. */
  onDelete?: (id: string) => void;
  /** Opens the tuning desk for the period's (or, without an id, the main plan's) targets; hidden when absent. */
  onEditTargets?: (periodId: string | null) => void;
  onClose: () => void;
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `period_${Date.now()}`);

/** Title + date range of a plan period, picked on a calendar. The main plan only gets a title. */
export default function PlanPeriodDialog({ target, onClose, ...rest }: Props) {
  const titleId = useId();
  return (
    <Dialog open={target !== null} onClose={onClose} labelledBy={titleId} className="max-w-md">
      {target && <PeriodForm key={target.kind === "period" ? target.period.id : target.kind} target={target} titleId={titleId} onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function PeriodForm({
  target,
  titleId,
  periods,
  onSavePeriod,
  onSaveMainTitle,
  onDelete,
  onEditTargets,
  onClose,
}: Omit<Props, "target"> & { target: PeriodTarget; titleId: string }) {
  const editing = target.kind === "period" ? target.period : null;
  const [title, setTitle] = useState(editing?.title ?? (target.kind === "period" ? "" : target.title));
  const [range, setRange] = useState<RangeDraft>({ start: editing?.start ?? null, end: editing?.end ?? null });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleInputId = useId();
  const withDates = target.kind !== "main";

  const trimmed = title.trim();
  const titleValid = trimmed.length > 0 && trimmed.length <= PLAN_TITLE_MAX;
  const complete = range.start !== null && range.end !== null;
  const clash = complete ? findOverlap(periods, { start: range.start!, end: range.end! }, editing?.id) : null;
  const canSave = titleValid && (!withDates || (complete && !clash));

  function save() {
    if (!canSave) return;
    if (target.kind === "main") onSaveMainTitle?.(trimmed);
    else {
      const plan = target.kind === "period" ? target.period.plan : target.plan;
      onSavePeriod({ id: editing?.id ?? newId(), title: trimmed, start: range.start!, end: range.end!, plan });
    }
    onClose();
  }

  const heading = target.kind === "main" ? "Ana plan" : editing ? "Dönemi düzenle" : "Yeni dönem";
  const hint = !withDates
    ? "Hiçbir dönemin kapsamadığı günlerde bu plan geçerli."
    : !range.start
      ? "Takvimde başlangıç gününe dokun."
      : !range.end
        ? "Şimdi bitiş gününe dokun."
        : `${formatRange({ start: range.start, end: range.end })} · ${rangeLength({ start: range.start, end: range.end })} gün`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="font-display text-lg">
          {heading}
        </h2>
        <button type="button" aria-label="Kapat" onClick={onClose} className="btn btn-ghost btn-icon-sm">
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div className="max-h-[70dvh] space-y-5 overflow-y-auto px-5 py-4">
        <div>
          <label htmlFor={titleInputId} className="label">
            Başlık
          </label>
          <input
            id={titleInputId}
            data-autofocus
            value={title}
            maxLength={PLAN_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Yaz cut'ı"
            aria-invalid={title !== "" && !titleValid}
            className="input"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLAN_TITLE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                aria-pressed={trimmed === s}
                className={`h-7 cursor-pointer rounded-full border px-3 text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                  trimmed === s ? "border-ink bg-ink text-on-ink" : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {withDates && (
          <div>
            <p className="label flex items-center gap-1.5">
              <CalendarRange aria-hidden className="size-3.5" /> Tarih aralığı
            </p>
            <div className="rounded-[10px] border border-border p-3">
              <RangeCalendar value={range} onChange={setRange} periods={periods} ignoreId={editing?.id} />
            </div>
          </div>
        )}
        <p aria-live="polite" className={`text-[13px] ${clash ? "text-danger-text" : "text-fg-muted"}`}>
          {clash ? `Bu aralık "${clash.title}" dönemiyle çakışıyor.` : hint}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2 px-5 py-4">
        {editing &&
          onDelete &&
          (confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete?.(editing.id);
                onClose();
              }}
              className="btn btn-danger h-9"
            >
              <Trash2 aria-hidden className="size-4" /> Evet, sil
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost-danger btn-icon-sm" aria-label="Dönemi sil">
              <Trash2 aria-hidden className="size-4" />
            </button>
          ))}
        {target.kind !== "new" && onEditTargets && (
          <button type="button" onClick={() => onEditTargets(editing?.id ?? null)} className="btn btn-ghost h-9 px-3 text-xs">
            <Pencil aria-hidden className="size-3.5" /> Hedefleri düzenle
          </button>
        )}
        <button type="submit" disabled={!canSave} className="btn btn-primary ml-auto">
          Kaydet
        </button>
      </div>
    </form>
  );
}
