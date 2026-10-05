"use client";

import { Loader2, Scale, Trash2 } from "lucide-react";
import type { useWeightLog } from "@/hooks/useWeightLog";
import { LOCALE } from "@/lib/dates";
import { WEIGHT_LIMITS } from "@/types/tracking";
import WeightChart from "../ui/WeightChart";

type WeightLog = ReturnType<typeof useWeightLog>;

const fmtKg = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });

/** Weigh-in form, trend chart, weekly rate and the estimate to the plan's target weight. */
export default function WeightCard({ log }: { log: WeightLog }) {
  const rate = log.rate;
  return (
    <section aria-labelledby="weight-heading" className="card p-4">
      <h2 id="weight-heading" className="card-title flex items-center gap-2">
        <Scale aria-hidden className="size-4 text-fg-muted" /> Kilo takibi
      </h2>

      <form onSubmit={log.submit} className="mt-3 flex gap-2">
        <label htmlFor="weight-input" className="sr-only">
          Bugünkü kilon (kg)
        </label>
        <input
          id="weight-input"
          value={log.input}
          onChange={(e) => log.setInput(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          placeholder={log.loggedToday ? "Bugünü güncelle (kg)" : "Bugünkü kilon (kg)"}
          aria-invalid={log.inputError}
          aria-describedby={log.inputError ? "weight-error" : undefined}
          className="input"
        />
        <button type="submit" disabled={!log.inputValid || log.saving} className="btn btn-primary h-10">
          {log.saving && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Kaydet
        </button>
      </form>
      {log.inputError && (
        <p id="weight-error" className="error-text">
          {WEIGHT_LIMITS.min}–{WEIGHT_LIMITS.max} kg arasında bir değer gir.
        </p>
      )}

      {log.error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-text">
          {log.error}
        </p>
      ) : log.loading ? (
        <div aria-hidden className="skeleton mt-4 h-32 w-full" />
      ) : !log.latest ? (
        <p className="mt-3 text-[13px] text-fg-subtle">
          {log.signedIn ? "İlk tartını gir; birkaç gün sonra eğilimini burada görürsün." : "Kilonu kaydetmek için giriş yap."}
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-1.5">
            <div className="tile min-w-0 px-2 text-center">
              <dt className="tile-label truncate">Ortalama</dt>
              <dd className="tile-value">{fmtKg(log.latest.trend)} kg</dd>
            </div>
            <div className="tile min-w-0 px-2 text-center">
              <dt className="tile-label truncate">Haftalık</dt>
              <dd className="tile-value">{rate === null ? "—" : `${rate > 0 ? "+" : ""}${fmtKg(rate)} kg`}</dd>
            </div>
            <div className="tile min-w-0 px-2 text-center">
              <dt className="tile-label truncate">Hedefe</dt>
              <dd className="tile-value">{log.target === null ? "—" : log.weeksLeft === null ? "—" : log.weeksLeft === 0 ? "Ulaştın" : `~${log.weeksLeft} hf`}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <WeightChart points={log.points} target={log.target} />
          </div>
          <p className="mt-3 text-xs text-fg-subtle">
            {log.target === null
              ? "Plan sihirbazında hedef kilo girersen tahmini süreyi de gösteririz."
              : log.weeksLeft === null
                ? "Tahmin için en az 3 tartı ve hedefe doğru bir eğilim gerekir."
                : "Tahmin son 4 haftadaki eğilime göre; gerçek ilerleme doğrusal değildir."}
          </p>
          {log.lastEntry && (
            <button type="button" onClick={() => log.lastEntry && void log.remove(log.lastEntry)} className="btn btn-ghost-danger mt-2 h-7 px-2 text-xs">
              <Trash2 aria-hidden className="size-3.5" /> Son tartıyı sil ({fmtKg(log.lastEntry.kg)} kg)
            </button>
          )}
        </>
      )}
    </section>
  );
}
