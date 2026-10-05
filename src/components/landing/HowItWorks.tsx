"use client";

import { motion, type MotionValue, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const STEPS = [
  { word: "Çek.", text: "Tabağının fotoğrafını çek; bileşenlerine ayıralım, porsiyonu kaydırarak düzelt." },
  { word: "Yaz.", text: "“Öğlen 200 g tavuk, bol salata” yaz; gerisini biz anlarız." },
  { word: "Okut.", text: "Paketli ürünün barkodunu okut; değerler açık veritabanından gelsin." },
  { word: "İzle.", text: "Halkalar günü, trendler haftayı anlatır. Kaçırdığın gün sıfır sayılmaz." },
] as const;

/**
 * Scene 3: a tall section with a pinned screen. As you scroll, one verb at a time lights up and
 * its lime underline grows, like reading a training plan line by line.
 */
export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} aria-labelledby="how-heading" className="relative h-[320svh] border-t border-ink-2">
      <div className="sticky top-0 flex h-svh items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <h2 id="how-heading" className="text-xs font-semibold tracking-[0.05em] text-cta uppercase">
            Nasıl çalışır
          </h2>
          <ol className="mt-6 space-y-4 sm:space-y-6">
            {STEPS.map((step, i) => (
              <Step key={step.word} index={i} count={STEPS.length} progress={scrollYProgress} {...step} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

interface StepProps {
  index: number;
  count: number;
  progress: MotionValue<number>;
  word: string;
  text: string;
}

function Step({ index, count, progress, word, text }: StepProps) {
  const start = index / count;
  const end = (index + 1) / count;
  // Scroll-linked animations run on the browser's scroll timeline, which only accepts offsets in 0..1.
  const range = [clamp(start - 0.06), clamp(start + 0.02), clamp(end - 0.02), clamp(end + 0.06)];
  const opacity = useTransform(progress, range, [index === 0 ? 1 : 0.2, 1, 1, index === count - 1 ? 1 : 0.2]);
  const x = useTransform(progress, range, [index === 0 ? 16 : 0, 16, 16, index === count - 1 ? 16 : 0]);
  const underline = useTransform(progress, [clamp(start - 0.02), start + 0.08], [index === 0 ? 1 : 0, 1]);

  return (
    <motion.li style={{ opacity, x }} className="grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
      <span className="relative inline-block justify-self-start font-display text-6xl leading-none sm:text-8xl">
        {word}
        <motion.span aria-hidden style={{ scaleX: underline }} className="absolute inset-x-0 -bottom-1 block h-1.5 origin-left bg-cta" />
      </span>
      <p className="max-w-md text-sm text-on-ink-muted sm:text-base">{text}</p>
    </motion.li>
  );
}
