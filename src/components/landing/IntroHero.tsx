"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { ROUTES } from "@/lib/routes";
import { EASE_WIPE, SPRING_SCENE } from "../ui/motion";
import MaskedWords from "./MaskedWords";

/** The four macro rings (calories, protein, carbs, fat) as a decorative emblem, outer to inner. */
const RINGS = [
  { r: 46, fill: 0.86, stroke: "var(--cta)" },
  { r: 37, fill: 0.72, stroke: "var(--macro-protein)" },
  { r: 28, fill: 0.64, stroke: "var(--macro-carbs)" },
  { r: 19, fill: 0.5, stroke: "var(--macro-fat)" },
] as const;

interface Props {
  onRegister: () => void;
  onLogin: () => void;
}

/** Scene 1: the headline rises word by word while the rings draw themselves; both drift away on scroll. */
export default function IntroHero({ onRegister, onLogin }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ringsY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const ringsRotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section ref={ref} aria-labelledby="landing-heading" className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden sm:min-h-[calc(100svh-5rem)]">
      <motion.svg
        aria-hidden
        viewBox="0 0 100 100"
        style={{ y: ringsY, rotate: ringsRotate }}
        className="pointer-events-none absolute top-1/2 -right-1/3 size-[110vw] max-w-[56rem] -translate-y-1/2 -rotate-90 opacity-40 sm:-right-24 sm:size-[70vw] lg:-right-24 lg:size-[44rem] lg:opacity-100"
      >
        {RINGS.map((ring, i) => (
          <g key={ring.r}>
            <circle cx="50" cy="50" r={ring.r} fill="none" stroke="var(--ink-2)" strokeWidth="6" />
            <motion.circle
              cx="50"
              cy="50"
              r={ring.r}
              fill="none"
              stroke={ring.stroke}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: reducedMotion ? ring.fill : 0 }}
              animate={{ pathLength: ring.fill }}
              transition={{ duration: 1.6, ease: EASE_WIPE, delay: 0.5 + i * 0.15 }}
            />
          </g>
        ))}
      </motion.svg>

      <motion.div style={{ opacity: textOpacity, y: textY }} className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: SPRING_SCENE }}
          className="text-xs font-semibold tracking-[0.05em] text-cta uppercase"
        >
          Kalori ve makro takibi
        </motion.p>
        <h1 id="landing-heading" className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] sm:text-7xl lg:max-w-[40rem] xl:text-8xl">
          <MaskedWords text="Şampiyonlar ne yediğini bilir." delay={0.1} />{" "}
          <MaskedWords text="Sen de bil." delay={0.5} className="text-cta" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.9 } }}
          className="mt-6 max-w-xl text-base text-on-ink-muted sm:text-lg"
        >
          Öğününün fotoğrafını çek, yaz ya da barkodunu okut. Kalorini ve makrolarını biz hesaplayalım; sen antrenmana odaklan.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 1.05 } }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <button type="button" onClick={onRegister} className="btn btn-primary btn-lg">
            Ücretsiz başla <ArrowRight aria-hidden className="size-4" />
          </button>
          <button type="button" onClick={onLogin} className="btn btn-on-ink btn-lg">
            Giriş yap
          </button>
          <Link href={ROUTES.panel} className="link ml-1 text-sm text-on-ink-muted hover:text-on-ink focus-visible:ring-offset-ink">
            Önce bir göz at
          </Link>
        </motion.div>
      </motion.div>

      <motion.a
        href="#efsaneler"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.6, duration: 0.4 } }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-[4px] text-xs text-on-ink-muted outline-none hover:text-on-ink focus-visible:ring-2 focus-visible:ring-ring"
      >
        Hikâyeleri keşfet
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown aria-hidden className="size-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
