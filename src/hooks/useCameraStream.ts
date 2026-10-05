"use client";

import { useEffect, useState, type RefObject } from "react";
import { captureFrame } from "@/lib/photo";

type Status = { kind: "starting" } | { kind: "ready" } | { kind: "error"; message: string };

const COUNTDOWN_STEP_MS = 650;

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Kamera erişimi engellendi. Bu site için kamera iznini ver ya da Yükle'yi kullan.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Bu cihazda kamera bulunamadı. Bunun yerine Yükle'yi kullan.";
    case "NotReadableError":
      return "Kamera başka bir uygulama tarafından kullanılıyor. O uygulamayı kapatıp tekrar dene.";
    default:
      return "Kamera başlatılamadı. Bunun yerine Yükle'yi kullan.";
  }
}

/**
 * Live camera preview with a 3-2-1 shutter countdown. The stream starts on mount and is released
 * on unmount, so render the consumer only while the camera should be on. Requires a secure
 * context (https or localhost).
 */
export function useCameraStream(videoRef: RefObject<HTMLVideoElement | null>, onCapture: (image: Blob) => void) {
  const [status, setStatus] = useState<Status>({ kind: "starting" });
  const [captureError, setCaptureError] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        // `autoPlay` alone isn't reliable on phones (iOS Low Power Mode, some Android WebViews):
        // without an explicit play() the preview stays black and captured frames come out empty.
        video.play().catch(() => {
          if (!cancelled) setStatus({ kind: "error", message: "Kamera önizlemesi başlatılamadı. Bunun yerine Yükle'yi kullan." });
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setStatus({ kind: "error", message: describeError(err) });
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoRef]);

  async function capture() {
    const video = videoRef.current;
    const frame = video ? await captureFrame(video) : null;
    if (!frame) {
      setCaptureError(true);
      return;
    }
    setFrozenFrame(frame.preview);
    onCapture(frame.blob);
  }

  function startCountdown() {
    if (countdown !== null) return;
    setCaptureError(false);
    let remaining = 3;
    setCountdown(remaining);
    const tick = () => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        setTimeout(tick, COUNTDOWN_STEP_MS);
      } else {
        setCountdown(null);
        void capture();
      }
    };
    setTimeout(tick, COUNTDOWN_STEP_MS);
  }

  return {
    ready: status.kind === "ready",
    errorMessage: status.kind === "error" ? status.message : null,
    captureError,
    countdown,
    frozenFrame,
    startCountdown,
    // "playing" rather than "loadedmetadata": mobile browsers report dimensions before the first
    // frame is decoded, and capturing then yields a black image (rejected as non-food).
    onPlaying: () => setStatus((s) => (s.kind === "error" ? s : { kind: "ready" })),
  };
}
