import { RotateCcw, TriangleAlert } from "lucide-react";

interface Props {
  title?: string;
  onRetry: () => void;
  compact?: boolean;
}

/** Shown by an ErrorBoundary in place of a section that crashed; the rest of the page keeps working. */
export default function ErrorFallback({ title = "Bu bölüm yüklenemedi", onRetry, compact = false }: Props) {
  return (
    <div role="alert" className={`card flex flex-col items-center text-center ${compact ? "p-4" : "p-8"}`}>
      <span aria-hidden className="flex size-10 items-center justify-center rounded-[10px] bg-danger-soft text-danger-text">
        <TriangleAlert className="size-5" />
      </span>
      <p className="mt-3 font-display text-base">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-fg-muted">Beklenmeyen bir hata oluştu. Sayfanın geri kalanı çalışmaya devam ediyor.</p>
      <button type="button" onClick={onRetry} className="btn btn-secondary mt-4">
        <RotateCcw aria-hidden className="size-4" /> Tekrar dene
      </button>
    </div>
  );
}
