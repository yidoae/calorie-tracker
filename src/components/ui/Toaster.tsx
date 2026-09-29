import { CircleAlert, CircleCheck, Info, PartyPopper, X } from "lucide-react";
import type { Toast, ToastTone } from "@/hooks/useToast";

const ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  celebrate: PartyPopper,
};

const TONE: Record<ToastTone, string> = {
  success: "text-success-text bg-success-soft",
  error: "text-danger-text bg-danger-soft",
  info: "text-accent-text bg-accent-soft",
  celebrate: "text-cta-fg bg-cta",
};

interface Props {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

/** Stack of toasts, bottom-centre on phones and bottom-left on desktop (FitBot owns bottom-right). */
export default function Toaster({ toasts, onDismiss }: Props) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+6rem))] z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:items-start"
    >
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-[10px] border border-border-strong bg-surface p-3 text-fg shadow-pop"
          >
            <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-[6px] ${TONE[t.tone]}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-1 text-[13px] text-fg-muted">{t.description}</p>}
            </div>
            <button type="button" aria-label="Kapat" onClick={() => onDismiss(t.id)} className="btn btn-ghost btn-icon-sm">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
