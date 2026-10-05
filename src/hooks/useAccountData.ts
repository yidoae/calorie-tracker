"use client";

import { useCallback, useState, type FormEvent } from "react";
import { accountService } from "@/services/accountService";
import { errorMessage } from "@/services/http";
import type { ExportFormat } from "@/types/account";
import { useAuth } from "./useAuth";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

/** "Verilerimi indir": downloads the account's data as JSON or CSV. */
export function useDataExport() {
  const toast = useToast();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const download = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);
      try {
        const { blob, filename } = await accountService.exportData(format);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success("Verilerin indirildi", filename);
      } catch (err) {
        toast.error("Veriler indirilemedi", errorMessage(err));
      } finally {
        setExporting(null);
      }
    },
    [toast],
  );

  return { exporting, download };
}

/** "Hesabımı sil": password-confirmed deletion of the account and all of its data. */
export function useAccountDeletion() {
  const { forgetSession } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const close = useCallback(() => {
    if (deleting) return;
    setOpen(false);
    setPassword("");
    setError(null);
  }, [deleting]);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!password) return;
      setDeleting(true);
      setError(null);
      try {
        await accountService.deleteAccount(password);
        setOpen(false);
        setPassword("");
        forgetSession();
        invalidateMeals();
        toast.info("Hesabın ve tüm verilerin silindi");
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setDeleting(false);
      }
    },
    [password, forgetSession, toast],
  );

  return { open, ask: () => setOpen(true), close, password, setPassword, error, deleting, submit };
}
