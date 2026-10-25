import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionContext, useSessionController } from "@/hooks/useSession";
import { ToastContext, useToastController } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";

/** Query cache, session and toasts for the whole app, in that order (the session uses the cache). */
export default function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 }, mutations: { retry: 0 } } }),
  );

  // Refetch stale data when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionController();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function ToastProvider({ children }: { children: ReactNode }) {
  const { current, show, dismiss } = useToastController();
  // A stable value: showing a toast must not re-render every screen that can show one.
  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && <Toast key={current.id} kind={current.kind} title={current.title} body={current.body} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}
