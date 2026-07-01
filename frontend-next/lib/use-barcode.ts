import { useEffect, useRef } from "react";

/**
 * Hybrid barcode listener for the POS:
 *  1. USB / Bluetooth scanners act as a fast keyboard. Keystrokes landing
 *     within ~50ms of each other and ending with Enter are treated as a
 *     scanned code (buffered chars), not casual typing.
 *  2. Camera scanning is opened on demand via BarcodeScannerDialog (native
 *     BarcodeDetector API on supported devices).
 *
 * The keyboard listener pauses while a text input/textarea is focused so
 * manual typing in the search or reference fields can't fake a scan.
 */
interface Options {
  onScan: (code: string) => void;
  /** Min characters to count as a scan vs. casual typing (default 4). */
  minLength?: number;
  /** Max ms between keystrokes to belong to one scan (default 50). */
  maxGapMs?: number;
  /** Pause while a form field is focused (default true). */
  pauseWhenInputFocused?: boolean;
  /** Master switch — disable the listener entirely. */
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minLength = 4,
  maxGapMs = 50,
  pauseWhenInputFocused = true,
  enabled = true,
}: Options) {
  const buffer = useRef("");
  const lastTime = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (pauseWhenInputFocused) {
        const el = e.target as HTMLElement | null;
        const tag = el?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;
      }

      const now = performance.now();
      const gap = now - lastTime.current;
      lastTime.current = now;

      if (gap > maxGapMs && buffer.current.length > 0) buffer.current = "";

      if (e.key === "Enter") {
        const code = buffer.current;
        buffer.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (e.key.length === 1) buffer.current += e.key;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minLength, maxGapMs, pauseWhenInputFocused, enabled]);
}
