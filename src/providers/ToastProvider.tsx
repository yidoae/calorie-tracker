"use client";

import type { ReactNode } from "react";
import Toaster from "@/components/ui/Toaster";
import { ToastContext, useToastController } from "@/hooks/useToast";

/** Provides useToast() to the app and renders the toast stack. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, dismiss, api } = useToastController();
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
