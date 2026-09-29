"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  className?: string;
  children: ReactNode;
}

/**
 * Modal built on the native <dialog> + showModal(): top layer (no z-index fights), inert page
 * behind it, focus trap and Esc for free. Esc and backdrop clicks call `onClose` so the parent
 * owns the open state. After opening, focus moves to the element marked `data-autofocus`
 * (showModal would otherwise focus the first button, usually the close icon).
 */
export default function Dialog({ open, onClose, labelledBy, describedBy, role = "dialog", className = "", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // The <dialog> itself only receives clicks on the backdrop; content sits in an inner element.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`modal ${className}`}
    >
      {open && children}
    </dialog>
  );
}
