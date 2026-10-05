"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { SPRING_SCENE } from "../ui/motion";

interface Props {
  text: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Reveal when scrolled into view instead of on mount. */
  inView?: boolean;
  className?: string;
}

/**
 * Display text whose words rise out of a mask one after another. Each word sits in a clipped box
 * (padded so Turkish dots and cedillas aren't cut off); screen readers get the plain sentence.
 */
export default function MaskedWords({ text, delay = 0, inView = false, className = "" }: Props) {
  const words = text.split(" ");
  const trigger = inView ? { whileInView: "shown", viewport: { once: true, margin: "-80px" } } : { animate: "shown" };

  return (
    <motion.span initial="hidden" {...trigger} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span className="-my-[0.12em] inline-block overflow-hidden py-[0.12em] align-bottom">
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { y: "110%" },
                  shown: { y: 0, transition: { ...SPRING_SCENE, delay: delay + i * 0.08 } },
                }}
              >
                {word}
              </motion.span>
            </span>
            {i < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </motion.span>
  );
}
