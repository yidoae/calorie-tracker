"use client";

import { LockKeyhole, X } from "lucide-react";
import { useId } from "react";
import { useAuth } from "@/hooks/useAuth";
import Dialog from "../ui/Dialog";

/**
 * "Üyelik bulunamadı…": shown when a guest tries a members-only action. Its buttons lead to the
 * sign-up / sign-in pages, which bring the visitor back to this page afterwards.
 */
export default function GuardDialog() {
  const { guardOpen, openAuth, closeGuard } = useAuth();
  const titleId = useId();
  const descId = useId();

  return (
    <Dialog open={guardOpen} onClose={closeGuard} labelledBy={titleId} describedBy={descId} className="max-w-[400px]">
      <div className="relative p-6 text-center">
        <button type="button" aria-label="Kapat" onClick={closeGuard} className="btn btn-ghost btn-icon-sm absolute top-4 right-4">
          <X aria-hidden className="size-4" />
        </button>
        <div aria-hidden className="mx-auto flex size-12 items-center justify-center rounded-[10px] bg-ink text-cta">
          <LockKeyhole className="size-6" />
        </div>
        <h2 id={titleId} className="mt-4 font-display text-2xl text-fg">
          Üyelik bulunamadı.
          <br />
          Üye olmak ister misiniz?
        </h2>
        <p id={descId} className="mx-auto mt-2 max-w-[288px] text-[13px] text-fg-muted">
          Öğün fotoğrafı yüklemek, kalori hesaplamak ve beslenme planı kaydetmek için ücretsiz bir hesap açın. Sonra bu sayfaya geri döneceksiniz.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" data-autofocus onClick={() => openAuth("register")} className="btn btn-primary btn-lg w-full">
            Üye ol
          </button>
          <button type="button" onClick={() => openAuth("login")} className="btn btn-secondary btn-lg w-full">
            Zaten üyeyim, giriş yap
          </button>
          <button type="button" onClick={closeGuard} className="btn btn-ghost w-full">
            Şimdi değil
          </button>
        </div>
      </div>
    </Dialog>
  );
}
