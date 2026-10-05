"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Open/closed state for a popover or menu that closes on outside click and on Escape (returning
 * focus to the trigger). `rootRef` wraps trigger + popover; `triggerRef` is the toggle button.
 */
export function useDisclosure(rootRef: RefObject<HTMLElement | null>, triggerRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, rootRef, triggerRef]);

  return { open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) };
}
