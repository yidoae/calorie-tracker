"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import FitBotAvatar from "../ui/FitBotAvatar";
import { SPRING_SCENE } from "../ui/motion";
import MaskedWords from "./MaskedWords";

interface Props {
  onRegister: () => void;
  onLogin: () => void;
}

const appear = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay } },
  viewport: { once: true, margin: "-80px" },
});

/** Scene 4: the closing line and the two ways in, then the footer. */
export default function FinalCall({ onRegister, onLogin }: Props) {
  return (
    <>
      <section aria-labelledby="cta-heading" className="flex min-h-[80svh] items-center border-t border-ink-2">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
          <motion.div {...appear(0)}>
            <FitBotAvatar className="size-14" />
          </motion.div>
          <h2 id="cta-heading" className="mt-8 font-display text-6xl leading-[1.02] sm:text-8xl lg:text-9xl">
            <MaskedWords text="Sıra" inView /> <MaskedWords text="sende." inView delay={0.08} className="text-cta" />
          </h2>
          <motion.p {...appear(0.3)} className="mt-6 max-w-xl text-base text-on-ink-muted sm:text-lg">
            Hedefini söyle, FitBot planını kursun. Hesap açmak bir dakika sürer; verilerini istediğin an indirir ya da silersin.
          </motion.p>
          <motion.div {...appear(0.4)} className="mt-10 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onRegister} className="btn btn-primary btn-lg">
              Planımı oluştur <ArrowRight aria-hidden className="size-4" />
            </button>
            <button type="button" onClick={onLogin} className="btn btn-on-ink btn-lg">
              Giriş yap
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-ink-2 text-on-ink-muted">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs sm:px-6">
          <p>Kalori Takip · Değerler yaklaşıktır ve tıbbi tavsiye yerine geçmez.</p>
          <nav aria-label="Alt menü" className="flex gap-4">
            <Link href={ROUTES.sources} className="link text-on-ink-muted hover:text-on-ink focus-visible:ring-offset-ink">
              Kaynaklar
            </Link>
            <Link href={ROUTES.panel} className="link text-on-ink-muted hover:text-on-ink focus-visible:ring-offset-ink">
              Uygulamaya göz at
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
