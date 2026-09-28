"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef } from "react";

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

/**
 * Confirmation modal used before destructive actions like deleting a meal. Built on the native
 * <dialog> with showModal(): it renders in the top layer (no z-index fights), makes the page
 * behind it inert, traps focus, and closes on Esc. Focus starts on Cancel, the safe choice.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        // Esc: let the parent own the open state instead of the browser closing it.
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // The dialog element itself only receives clicks on the backdrop; content sits in the inner div.
        if (e.target === e.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-surface p-0 text-fg shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          {danger && (
            <div aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger-text">
              <TriangleAlert className="size-[18px]" />
            </div>
          )}
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-[15px] font-semibold">
              {title}
            </h2>
            <p id={messageId} className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`btn ${danger ? "btn-danger" : "btn-primary"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
