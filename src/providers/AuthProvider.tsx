"use client";

import type { ReactNode } from "react";
import AuthDialog from "@/components/auth/AuthDialog";
import { AuthContext, useAuthController } from "@/hooks/useAuth";

/** Provides account state (useAuth) to the app and renders the sign-in / guard dialog. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthController();
  return (
    <AuthContext.Provider value={auth}>
      {children}
      <AuthDialog />
    </AuthContext.Provider>
  );
}
