"use client";

import { HeartHandshake } from "lucide-react";
import { useId } from "react";
import type { SensitiveWarning } from "@/hooks/usePlanWizard";
import Dialog from "../ui/Dialog";

interface Props {
  warning: SensitiveWarning | null;
  onAccept: () => void;
  onDecline: () => void;
}

const TEXT: Record<SensitiveWarning["kind"], { title: string; body: string; decline: string }> = {
  fasting: {
    title: "Aralıklı oruç herkese uygun değil",
    body: "Uzun açlık pencereleri, yeme bozukluğu geçmişi olanlarda, hamilelik ve emzirme döneminde, diyabette ya da ilaç kullanırken sorun yaratabilir.",
    decline: "Bana göre değil, klasik düzende kal",
  },
  deficit: {
    title: "Büyük bir kalori açığı seçiyorsun",
    body: "Günde 750 kcal ve üzeri açık hızlı sonuç verebilir ama yorgunluk, kas kaybı ve yeme ile ilgili zorlayıcı düşünceler riskini artırır. Çoğu kişi için daha küçük bir açık daha sürdürülebilirdir.",
    decline: "Bana göre değil, daha küçük bir açık seç",
  },
};

/**
 * Shown once before 16:8 fasting or a large deficit. "Not for me" is a first-class answer that
 * keeps the gentler option; it never blocks the user.
 */
export default function SensitiveWarningDialog({ warning, onAccept, onDecline }: Props) {
  const titleId = useId();
  const bodyId = useId();
  const text = warning ? TEXT[warning.kind] : null;

  return (
    <Dialog open={warning !== null} onClose={onDecline} labelledBy={titleId} describedBy={bodyId} className="max-w-md">
      {text && (
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-warning-soft text-warning-text">
              <HeartHandshake className="size-[18px]" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id={titleId} className="font-display text-lg">
                {text.title}
              </h2>
              <div id={bodyId} className="mt-2 space-y-2 text-[13px] leading-relaxed text-fg-muted">
                <p>{text.body}</p>
                <p>
                  Yemekle ilişkin seni endişelendiriyorsa ya da yeme bozukluğu yaşadıysan, devam etmeden önce aile hekimin, bir diyetisyen veya bir ruh
                  sağlığı uzmanıyla konuş. Acil bir durumda <strong className="text-fg">112</strong>&apos;yi ara.
                </p>
                <p>
                  Yurt dışı kaynaklar:{" "}
                  <a href="https://www.beateatingdisorders.org.uk/" target="_blank" rel="noreferrer" className="link">
                    Beat
                  </a>{" "}
                  ·{" "}
                  <a href="https://www.nationaleatingdisorders.org/" target="_blank" rel="noreferrer" className="link">
                    NEDA
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" data-autofocus onClick={onDecline} className="btn btn-secondary h-auto min-h-9 py-2 whitespace-normal">
              {text.decline}
            </button>
            <button type="button" onClick={onAccept} className="btn btn-ghost">
              Anladım, devam et
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
