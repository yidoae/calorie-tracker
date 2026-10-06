"use client";

import { motion, type Variants } from "motion/react";
import { EASE_OUT } from "./motion";

interface Props {
  /** Pixel size (square). */
  size?: number;
}

/** Share of the ring that's "full" at rest; it closes on hover, like a day hitting its target. */
const REST = 0.72;

// "rest" also plays on load (from an empty ring), so it draws slowly; "hover" snaps shut.
const DRAW = { duration: 1.2, ease: EASE_OUT, delay: 0.15 };
const SNAP = { duration: 0.5, ease: EASE_OUT };

const arc: Variants = {
  hidden: { pathLength: 0 },
  rest: { pathLength: REST, transition: DRAW },
  hover: { pathLength: 1, transition: SNAP },
};

const tip: Variants = {
  hidden: { rotate: 0 },
  rest: { rotate: REST * 360, transition: DRAW },
  hover: { rotate: 360, transition: SNAP },
};

/**
 * The brand mark: the dashboard's calorie ring in miniature. On load the lime arc draws itself
 * around an ink track and a dot rides its tip; the flame inside flickers. The parent drives it:
 * a motion element with initial="hidden" animate="rest" whileHover="hover" (hover closes the
 * ring). Decorative: the wordmark next to it carries the name.
 */
export default function LogoMark({ size = 40 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0 overflow-visible">
      <circle cx="20" cy="20" r="16" fill="none" className="stroke-ink-2" strokeWidth="4" />
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        className="stroke-cta"
        strokeWidth="4"
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        variants={arc}
      />
      <motion.g
        style={{ transformOrigin: "20px 20px", transformBox: "view-box" }}
        variants={tip}
      >
        <circle cx="20" cy="4" r="3" className="fill-on-ink stroke-cta" strokeWidth="1.5" />
      </motion.g>
      {/* Flame (lucide "flame" path, scaled into the ring), flickering from its base. */}
      <motion.g
        style={{ transformOrigin: "20px 28px", transformBox: "view-box" }}
        initial={{ scaleY: 0.4, opacity: 0 }}
        animate={{ scaleY: [1, 1.1, 0.95, 1.05, 1], scaleX: [1, 0.94, 1.04, 0.97, 1], opacity: 1 }}
        transition={{
          scaleY: { duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: 0.9 },
          scaleX: { duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: 0.9 },
          opacity: { duration: 0.3, delay: 0.6 },
        }}
      >
        <path
          transform="translate(11 10.5) scale(0.75)"
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          className="fill-cta stroke-cta"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );
}
