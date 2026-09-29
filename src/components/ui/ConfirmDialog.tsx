"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import Dialog from "./Dialog";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button + warning icon for destructive actions (the default). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation before destructive actions. Focus starts on Cancel, the safe choice. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const messageId = useId();

  return (
    <Dialog open={open} onClose={onCancel} labelledBy={titleId} describedBy={messageId} role="alertdialog" className="max-w-sm">
      <div className="p-6">
        <div className="flex items-start gap-3">
          {danger && (
            <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-danger-soft text-danger-text">
              <TriangleAlert className="size-[18px]" />
            </div>
          )}
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="font-display text-lg">
              {title}
            </h2>
            <p id={messageId} className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" data-autofocus onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`btn ${danger ? "btn-danger" : "btn-primary"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
