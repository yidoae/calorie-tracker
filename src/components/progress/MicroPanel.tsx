"use client";

import { Info } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { MICRO_LABELS } from "@/lib/labels";
import type { MicroReference, MicroTotals } from "@/lib/nutrition/micros";
import { ROUTES } from "@/lib/routes";
import { MICRO_KEYS, type MicroKey } from "@/types/nutrition";
import DashCard from "../ui/DashCard";
import { EASE_OUT } from "../ui/motion";

interface Props {
  index: number;
  micros: MicroTotals & { references: Record<MicroKey, MicroReference> };
}

/** Share of a limit from which it counts as "close". */
const NEAR_LIMIT = 0.8;
const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/** "Mikro besinler": fibre (a goal) and sugar, saturated fat, sodium (limits), each with a status tag. */
export default function MicroPanel({ index, micros }: Props) {
  return (
    <DashCard index={index} id="micro-heading" eyebrow="Bugün" title="Mikro besinler">
      {micros.total === 0 ? (
        <p className="text-[13px] text-fg-subtle">Öğün ekledikçe lif, şeker, doymuş yağ ve sodyum burada görünür.</p>
      ) : (
        <ul className="space-y-4">
          {MICRO_KEYS.map((key, i) => {
            const ref = micros.references[key];
            const value = micros.values[key];
            const { label, unit } = MICRO_LABELS[key];
            const share = ref.amount > 0 ? value / ref.amount : 0;
            const status =
              ref.mode === "min"
                ? share >= 1
                  ? { text: "Hedef tamam", tag: "bg-success-soft text-success-text", bar: "bg-success" }
                  : { text: `Hedefe ${fmt(ref.amount - value)} ${unit}`, tag: "bg-surface-2 text-fg-muted", bar: "bg-macro-carbs" }
                : share > 1
                  ? { text: "Sınırı aştın", tag: "bg-danger-soft text-danger-text", bar: "bg-danger" }
                  : share >= NEAR_LIMIT
                    ? { text: "Sınıra yakın", tag: "bg-danger-soft text-danger-text", bar: "bg-danger" }
                    : { text: `${fmt(ref.amount - value)} ${unit} pay var`, tag: "bg-success-soft text-success-text", bar: "bg-success" };
            return (
              <li key={key}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-fg-muted tabular-nums">
                    <b className="font-semibold text-fg">{fmt(value)}</b> / {fmt(ref.amount)} {unit}
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <motion.span
                    className={`absolute inset-y-0 left-0 rounded-full ${status.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(1, share) * 100}%` }}
                    transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.35 + i * 0.08 }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-fg-subtle">
                  <span>{ref.mode === "min" ? "Günlük hedef" : "Günlük üst sınır"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${status.tag}`}>{status.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {micros.total > 0 && (
        <p className="mt-4 flex items-start gap-1.5 text-xs text-fg-subtle">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {micros.covered < micros.total
              ? `${micros.total} bileşenin ${micros.covered} tanesinde mikro besin verisi var; gerçek değerler daha yüksek olabilir. `
              : "Değerler yaklaşıktır. "}
            <Link href={ROUTES.sources} className="link">
              Referans değerler
            </Link>
          </span>
        </p>
      )}
    </DashCard>
  );
}
