"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { barcodeSchema } from "@/types/food";

type Status = { kind: "starting" } | { kind: "scanning" } | { kind: "error"; message: string };

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Kamera erişimi engellendi. Barkodu aşağıya elle yazabilirsin.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Bu cihazda kamera bulunamadı. Barkodu aşağıya elle yazabilirsin.";
  return "Kamera başlatılamadı. Barkodu aşağıya elle yazabilirsin.";
}

/**
 * Live barcode reading from the back camera (EAN/UPC on food packs). The decoder (ZXing) is
 * loaded only when the scanner opens; the camera is released on unmount or after the first read.
 */
export function useBarcodeScanner(videoRef: RefObject<HTMLVideoElement | null>, onDetected: (barcode: string) => void) {
  // The scanner only mounts after a click, so `navigator` exists here.
  const [status, setStatus] = useState<Status>(() =>
    typeof navigator.mediaDevices?.getUserMedia === "function"
      ? { kind: "starting" }
      : { kind: "error", message: "Canlı kamera bu bağlantıda kullanılamıyor (https gerekir). Barkodu elle yazabilirsin." },
  );
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (typeof navigator.mediaDevices?.getUserMedia !== "function") return;
    let cancelled = false;
    let stop: (() => void) | null = null;

    import("@zxing/browser")
      .then(async ({ BrowserMultiFormatOneDReader }) => {
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatOneDReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          videoRef.current,
          (result, _error, ctl) => {
            const text = result?.getText();
            if (!text || !barcodeSchema.safeParse(text).success) return;
            ctl.stop();
            onDetectedRef.current(text);
          },
        );
        if (cancelled) controls.stop();
        else {
          stop = () => controls.stop();
          setStatus({ kind: "scanning" });
        }
      })
      .catch((err: unknown) => !cancelled && setStatus({ kind: "error", message: describeError(err) }));

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [videoRef]);

  return {
    scanning: status.kind === "scanning",
    errorMessage: status.kind === "error" ? status.message : null,
  };
}
