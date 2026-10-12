import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  appleSignInAvailable,
  exchangeAuthCode,
  googleSignInAvailable,
  resendConfirmation,
  signInWithApple,
  signInWithGoogle,
  signOut,
} from "@/services/authService";
import { appError, toAppError } from "@/services/errors";
import { useToast } from "./useToast";

type Provider = "apple" | "google";

/** Google and Apple buttons: shown only where they work; errors go to a toast, cancelling is silent. */
export function useSocialSignIn() {
  const toast = useToast();
  const apple = useQuery({ queryKey: ["appleSignInAvailable"], queryFn: appleSignInAvailable, staleTime: Infinity });
  const [pending, setPending] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    if (pending) return;
    setPending(provider);
    try {
      await (provider === "apple" ? signInWithApple() : signInWithGoogle());
    } catch (err) {
      toast.show("error", "Giriş yapılamadı", toAppError(err).message);
    } finally {
      setPending(null);
    }
  }

  return { appleAvailable: apple.data === true, googleAvailable: googleSignInAvailable, pending, signIn };
}

/** "E-postayı yeniden gönder" for an unconfirmed sign-up. */
export function useResendConfirmation() {
  const toast = useToast();
  return useMutation({
    mutationFn: resendConfirmation,
    onSuccess: () => toast.show("success", "Doğrulama e-postası yeniden gönderildi", "Gelen kutunu, gerekirse spam klasörünü kontrol et."),
    onError: (err) => toast.show("error", "E-posta gönderilemedi", toAppError(err).message),
  });
}

/** "Çıkış yap": the session, the query cache (useSession) and the Google account choice go (FR-005). */
export function useSignOut() {
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      await signOut();
      toast.show("info", "Çıkış yaptın", "Bu cihazda hesabına ait bir şey kalmadı.");
    } catch (err) {
      toast.show("error", "Çıkış yapılamadı", toAppError(err).message);
    } finally {
      setPending(false);
    }
  }

  return { signOut: run, pending };
}

/**
 * Exchanges the code of an e-mail link for a session (T029), once per code even if the screen
 * mounts twice. A missing code means the link was broken or Supabase reported an error instead.
 */
export function useAuthLink(code: string | undefined) {
  return useQuery({
    queryKey: ["authLink", code],
    queryFn: async () => {
      if (!code) throw appError("link_invalid");
      await exchangeAuthCode(code);
      return true;
    },
    retry: false,
    staleTime: Infinity,
  });
}
