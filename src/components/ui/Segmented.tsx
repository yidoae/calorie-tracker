"use client";

import { motion } from "motion/react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { SPRING } from "./motion";

export interface SegmentedItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Tabs point at `${idPrefix}-${id}` via aria-controls; give the panels those ids. */
  idPrefix: string;
  className?: string;
}

/** A segmented control with tab semantics: roving tabindex, ←/→/Home/End to switch. */
export default function Segmented<T extends string>({ items, value, onChange, label, idPrefix, className = "" }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-1 rounded-[6px] border border-border-strong bg-surface p-1 ${className}`}
    >
      {items.map(({ id, label: itemLabel, icon }, i) => {
        const selected = id === value;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative flex h-8 min-w-0 cursor-pointer items-center justify-center rounded-[4px] px-2 text-[13px] font-semibold outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring ${
              selected ? "text-on-ink" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {/* The ink pill slides from the old tab to the new one. */}
            {selected && <motion.span layoutId={`${idPrefix}-pill`} transition={SPRING} aria-hidden className="absolute inset-0 rounded-[4px] bg-ink" />}
            <span className="relative flex min-w-0 items-center gap-2">
              {icon}
              <span className="truncate">{itemLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
