"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

/**
 * Camera barcode scanner using the native BarcodeDetector API where available
 * (Chrome/Edge on Android, modern Safari). Falls back to a clear message and
 * advice to use a hardware scanner when unsupported.
 */
export function BarcodeScannerDialog({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSupported(null);
      setError(null);
      return;
    }
    let cancelled = false;

    async function start() {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
        .BarcodeDetector;
      if (!Detector) {
        setSupported(false);
        return;
      }
      try {
        const detector = new Detector({
          formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
        });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setSupported(true);

        let lastScan = 0;
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          const now = performance.now();
          if (now - lastScan > 200) {
            lastScan = now;
            try {
              const codes = await detector.detect(videoRef.current);
              const code = codes[0]?.rawValue;
              if (code) {
                onScan(code);
                onOpenChange(false);
                return;
              }
            } catch {
              /* per-frame failures are noisy and harmless */
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not access the camera.");
        setSupported(false);
      }
    }
    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {supported === null && (
            <div className="grid aspect-video place-items-center rounded-xl bg-secondary/50 text-sm text-muted-foreground">
              Starting camera…
            </div>
          )}
          {supported === true && (
            <>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground ring-1 ring-border">
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="h-28 w-3/4 rounded-xl border-2 border-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Hold the barcode inside the frame.
              </p>
            </>
          )}
          {supported === false && (
            <div className="rounded-xl bg-accent/10 p-4 ring-1 ring-accent/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-accent" />
                <div className="text-sm">
                  <p className="font-semibold">Camera scanning isn&apos;t available here.</p>
                  <p className="mt-1 text-muted-foreground">
                    {error || "This browser doesn't support the BarcodeDetector API."}
                  </p>
                  <p className="mt-3 flex items-start gap-1.5 text-muted-foreground">
                    <Camera className="mt-0.5 size-4 shrink-0" />
                    USB / Bluetooth scanners still work — just point and scan, the POS detects it
                    automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
