"use client";

import { motion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { SPRING } from "./motion";

export interface ChipOption<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}

/** A single-choice row of pills with radio semantics (←/→ to move). */
export default function ChipGroup<T extends string>({ options, value, onChange, label }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillId = useId();

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = options.length - 1;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (index === 0 ? last : index - 1) : null;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option, i) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative h-8 cursor-pointer rounded-full border px-3 text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
              selected ? "border-ink text-on-ink" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
            }`}
          >
            {selected && <motion.span layoutId={pillId} transition={SPRING} aria-hidden className="absolute -inset-px rounded-full bg-ink" />}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
