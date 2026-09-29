import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  /** 0–1. */
  progress: number;
  /** Diameter in px (multiple of 4). */
  size: number;
  /** Stroke width in px. */
  stroke?: number;
  /** Tailwind stroke class for the arc, e.g. "stroke-macro-protein". */
  arcClass: string;
  /** Tailwind stroke class for the track. */
  trackClass?: string;
  /** Goal met: shows a check badge. */
  reached?: boolean;
  /** Play the one-off celebration (pop + burst). */
  celebrating?: boolean;
  label: string;
  valueText: string;
  children?: ReactNode;
}

const BURST = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Circular progress indicator (SVG). The arc animates to its value; when `celebrating`, the ring
 * pops and a small burst of dots flies out (disabled under prefers-reduced-motion via globals.css).
 */
export default function ProgressRing({
  progress,
  size,
  stroke = 8,
  arcClass,
  trackClass = "stroke-surface-3",
  reached = false,
  celebrating = false,
  label,
  valueText,
  children,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={valueText}
      className={`relative inline-flex shrink-0 items-center justify-center ${celebrating ? "animate-ring-pop" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${arcClass} transition-[stroke-dashoffset,stroke] duration-700 ease-out`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>

      {reached && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex size-6 animate-check-in items-center justify-center rounded-full border-2 border-surface bg-success text-ink"
        >
          <Check className="size-3" strokeWidth={3.5} />
        </span>
      )}

      {celebrating && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {BURST.map((deg, i) => (
            <span
              key={deg}
              className={`absolute top-1/2 left-1/2 size-2 animate-burst rounded-full ${i % 2 ? "bg-cta" : "bg-accent"}`}
              style={{ "--burst-angle": `${deg}deg`, "--burst-distance": `${size / 2 + 12}px` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
    </div>
  );
}
