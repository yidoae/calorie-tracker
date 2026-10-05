"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { FADE, SPRING } from "./motion";

interface Props {
  show: boolean;
  /** Called only while shown; during the exit animation the last render is kept. */
  children: () => ReactNode;
  className?: string;
}

/**
 * A panel that expands open (height + fade, rising from below) and collapses on close, so the
 * content under it slides instead of jumping.
 */
export default function Reveal({ show, children, className = "" }: Props) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="reveal"
          initial={{ opacity: 0, height: 0, y: 8 }}
          animate={{ opacity: 1, height: "auto", y: 0, transition: SPRING }}
          exit={{ opacity: 0, height: 0, y: -8, transition: { ...FADE, height: SPRING } }}
          className={`overflow-hidden ${className}`}
        >
          {children()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
