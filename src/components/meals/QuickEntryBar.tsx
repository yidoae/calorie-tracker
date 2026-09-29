"use client";

import { CircleHelp, CornerDownLeft, Loader2, Sparkles, WandSparkles, X } from "lucide-react";
import { useQuickEntry } from "@/hooks/useQuickEntry";
import { LOCALE } from "@/lib/dates";
import CategoryChip from "../ui/CategoryChip";

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/**
 * One-line natural-language logging: "Öğlen 200g ızgara tavuk, bol salata ve 1 dilim tam buğday
 * ekmeği" → recognised items with grams and a live macro total; Enter logs it.
 */
export default function QuickEntryBar() {
  const q = useQuickEntry();
  const hasItems = (q.result?.items.length ?? 0) > 0;

  return (
    <section aria-labelledby="quick-heading" className="card p-4 sm:p-6">
      <h2 id="quick-heading" className="section-title flex items-center gap-2">
        <WandSparkles aria-hidden className="size-4 text-accent" /> Hızlı giriş
      </h2>

      <form onSubmit={q.submit} className="mt-3 flex gap-2">
        <label htmlFor="quick-input" className="sr-only">
          Ne yedin? Serbest metinle yaz
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            id="quick-input"
            value={q.text}
            onChange={(e) => q.setText(e.target.value)}
            placeholder="örn. Öğlen 200 g ızgara tavuk, bol salata ve 1 dilim ekmek"
            autoComplete="off"
            maxLength={300}
            aria-describedby="quick-preview"
            className="input h-12 pr-10"
          />
          {q.text && (
            <button type="button" aria-label="Temizle" onClick={q.clear} className="btn btn-ghost btn-icon-sm absolute top-2 right-2">
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <button type="submit" disabled={!q.canSave} className="btn btn-primary h-12 px-4">
          {q.saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CornerDownLeft aria-hidden className="size-4" />}
          <span className="hidden sm:inline">Ekle</span>
        </button>
      </form>

      <div id="quick-preview" aria-live="polite" className="empty:hidden">
        {q.result && (hasItems || q.result.unmatched.length > 0) && (
          <div className="mt-4 animate-enter space-y-3">
            {hasItems && (
              <ul className="flex flex-wrap gap-2">
                {q.result.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pr-3 pl-1 text-[13px]">
                    <CategoryChip category={item.category} />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-fg-muted tabular-nums">{fmt(item.grams)} g</span>
                  </li>
                ))}
              </ul>
            )}

            {q.totals && hasItems && (
              <p className="text-[13px] text-fg-muted tabular-nums">
                <span className="font-display text-base text-fg">{fmt(q.totals.calories)} kcal</span> · P {fmt(q.totals.protein)} g · K{" "}
                {fmt(q.totals.carbs)} g · Y {fmt(q.totals.fat)} g
                {q.result.name && <span> · &ldquo;{q.result.name}&rdquo; olarak kaydedilecek</span>}
              </p>
            )}

            {q.result.aiMatched.length > 0 && (
              <p className="flex items-center gap-2 text-xs text-accent-text">
                <Sparkles aria-hidden className="size-3" /> Yapay zekâ ile eşleştirildi: {q.result.aiMatched.join(", ")}
              </p>
            )}

            {q.aiPending ? (
              <p className="flex items-center gap-2 text-xs text-fg-muted">
                <Loader2 aria-hidden className="size-3 animate-spin" /> Tanınmayan kelimeler yapay zekâya soruluyor…
              </p>
            ) : (
              q.result.unmatched.length > 0 && (
                <p className="flex items-center gap-2 text-xs text-warning-text">
                  <CircleHelp aria-hidden className="size-3" /> Tanınmadı: {q.result.unmatched.join(", ")}
                </p>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
