"use client";

import type { ReactNode } from "react";
import GuardDialog from "@/components/auth/GuardDialog";
import { AuthContext, useAuthController } from "@/hooks/useAuth";

/** Provides account state (useAuth) to the app and renders the "no membership" dialog. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthController();
  return (
    <AuthContext.Provider value={auth}>
      {children}
      <GuardDialog />
    </AuthContext.Provider>
  );
}
