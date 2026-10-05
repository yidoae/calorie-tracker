"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { SPRING_NUMBER } from "./motion";

interface Props {
  value: number;
  /** Formats the in-between values too (defaults to a rounded tr-TR number). */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString("tr-TR");

/**
 * A number that springs to its new value. It renders the target value on the server and on first
 * paint, so there's no hydration mismatch; later changes count up or down. Under reduced motion
 * it jumps straight to the value.
 */
export default function AnimatedNumber({ value, format = defaultFormat, className }: Props) {
  const reduced = useReducedMotion();
  const spring = useSpring(value, SPRING_NUMBER);
  const text = useTransform(spring, format);

  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [value, reduced, spring]);

  return <motion.span className={className}>{text}</motion.span>;
}
