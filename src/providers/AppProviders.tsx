"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";

/**
 * All client-side context providers, in dependency order (auth shows toasts). MotionConfig turns
 * transform and layout animations off for visitors who prefer reduced motion.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
