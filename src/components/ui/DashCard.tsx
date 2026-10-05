"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cardEnter, EASE_OUT } from "./motion";

interface Props {
  /** Position on the dashboard; staggers the entrance. */
  index: number;
  /** id of the heading, for aria-labelledby. */
  id: string;
  eyebrow: string;
  title: string;
  /** Right side of the header (a total, a pill, a button). */
  aside?: ReactNode;
  /** "ink" for the dark hero card. */
  tone?: "light" | "ink";
  /** Changing this number plays a short lime ring around the card (e.g. "look here"). */
  highlight?: number;
  className?: string;
  children: ReactNode;
}

/** A dashboard card: rises into place on load, eyebrow + title header, optional highlight pulse. */
export default function DashCard({ index, id, eyebrow, title, aside, tone = "light", highlight = 0, className = "", children }: Props) {
  const ink = tone === "ink";
  return (
    <motion.section
      {...cardEnter(index)}
      aria-labelledby={id}
      className={`relative min-w-0 rounded-[20px] border p-5 transition-colors duration-300 sm:p-6 ${
        ink ? "border-ink bg-ink text-on-ink" : "border-border-strong bg-surface text-fg"
      } ${className}`}
    >
      {highlight > 0 && (
        <motion.span
          key={highlight}
          aria-hidden
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 1, ease: EASE_OUT }}
          className="pointer-events-none absolute -inset-1 rounded-[24px] border-4 border-cta"
        />
      )}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className={`block text-[11px] font-semibold tracking-[0.12em] uppercase ${ink ? "text-on-ink-muted" : "text-fg-subtle"}`}>{eyebrow}</span>
          <h2 id={id} className="font-display text-xl leading-tight">
            {title}
          </h2>
        </div>
        {aside}
      </header>
      {children}
    </motion.section>
  );
}
