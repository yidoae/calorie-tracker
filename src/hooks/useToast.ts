"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info" | "celebrate";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface ToastApi {
  show: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  celebrate: (title: string, description?: string) => void;
}

const DURATION_MS: Record<ToastTone, number> = { success: 4000, info: 4000, celebrate: 5000, error: 6500 };
const MAX_VISIBLE = 4;

export const ToastContext = createContext<ToastApi | null>(null);

/** Toast queue state; used once, by ToastProvider. */
export function useToastController() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { ...toast, id }]);
      setTimeout(() => dismiss(id), DURATION_MS[toast.tone]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ tone: "success", title, description }),
      error: (title, description) => show({ tone: "error", title, description }),
      info: (title, description) => show({ tone: "info", title, description }),
      celebrate: (title, description) => show({ tone: "celebrate", title, description }),
    }),
    [show],
  );

  return { toasts, dismiss, api };
}

/** Show short feedback messages (bottom of the screen). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
