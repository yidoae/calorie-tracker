import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

const VISIBLE_MS = 3500;

interface ToastApi {
  show: (kind: ToastKind, title: string, body?: string) => void;
  dismiss: () => void;
}

/** Used once, by ToastProvider: one toast at a time; a new one replaces the old. */
export function useToastController(): ToastApi & { current: ToastMessage | null } {
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(null);
  }, []);

  const show = useCallback((kind: ToastKind, title: string, body?: string) => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent({ id: nextId.current++, kind, title, body });
    timer.current = setTimeout(() => setCurrent(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { current, show, dismiss };
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Success and error feedback after an action (FR-022). */
export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
