"use client";

import { TriangleAlert } from "lucide-react";

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

/** A small centered confirmation modal, used before destructive actions like deleting a meal. */
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
  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-start gap-3">
          {danger && <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />}
          <div>
            <h2 id="confirm-dialog-title" className="font-semibold">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-10 rounded-xl px-4 text-sm font-medium text-white transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
