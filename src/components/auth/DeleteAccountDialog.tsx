"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useId, type FormEvent } from "react";
import Dialog from "../ui/Dialog";

interface Props {
  open: boolean;
  password: string;
  error: string | null;
  deleting: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

/** Password-confirmed, irreversible deletion of the account and all of its data. */
export default function DeleteAccountDialog({ open, password, error, deleting, onPasswordChange, onSubmit, onClose }: Props) {
  const titleId = useId();
  const bodyId = useId();
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} describedBy={bodyId} role="alertdialog" className="max-w-sm">
      <form onSubmit={onSubmit} className="p-6">
        <div className="flex items-start gap-3">
          <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-danger-soft text-danger-text">
            <TriangleAlert className="size-[18px]" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="font-display text-lg">
              Hesabın silinsin mi?
            </h2>
            <p id={bodyId} className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              Tüm öğünlerin, fotoğrafların, kilo ve su kayıtların, kayıtlı öğünlerin ve planın kalıcı olarak silinir. Bu işlem geri alınamaz; önce verilerini
              indirmek isteyebilirsin.
            </p>
          </div>
        </div>
        <label htmlFor="delete-password" className="label mt-4">
          Onaylamak için şifren
        </label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          data-autofocus
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "delete-error" : undefined}
          className="input"
        />
        {error && (
          <p id="delete-error" role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={deleting} className="btn btn-secondary">
            Vazgeç
          </button>
          <button type="submit" disabled={!password || deleting} className="btn btn-danger disabled:bg-surface-3 disabled:text-fg-subtle">
            {deleting && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Hesabımı kalıcı olarak sil
          </button>
        </div>
      </form>
    </Dialog>
  );
}
