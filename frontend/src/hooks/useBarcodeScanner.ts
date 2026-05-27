import { useEffect, useRef } from 'react'

/**
 * Hybrid barcode listener:
 *  1. USB / Bluetooth barcode scanners → these act as a fast keyboard. We
 *     detect input that lands within ~50ms of the previous keystroke and
 *     ends with Enter, treating the buffered chars as a scanned code.
 *  2. Camera scanning is opened on demand via the BarcodeScannerModal
 *     component (uses the native BarcodeDetector API on supported devices).
 *
 * Keyboard listener intentionally NOT mounted on text inputs, so manual
 * typing in form fields doesn't accidentally trigger a "scan."
 */

interface Options {
  onScan: (code: string) => void
  /** Min characters to consider a scan vs. casual typing (default 4). */
  minLength?: number
  /** Max ms between keystrokes for them to count as part of one scan (default 50). */
  maxGapMs?: number
  /** Disable while a modal/input is focused (default true). */
  pauseWhenInputFocused?: boolean
}

export function useBarcodeScanner({
  onScan,
  minLength = 4,
  maxGapMs = 50,
  pauseWhenInputFocused = true,
}: Options) {
  const bufferRef = useRef('')
  const lastTimeRef = useRef(0)
  const onScanRef = useRef(onScan)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (pauseWhenInputFocused) {
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
        const isEditable = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable
        if (isEditable) return
      }

      const now = performance.now()
      const gap = now - lastTimeRef.current
      lastTimeRef.current = now

      // Reset buffer if gap too long (treats this as a fresh keystroke, not a scan)
      if (gap > maxGapMs && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current
        bufferRef.current = ''
        if (code.length >= minLength) {
          e.preventDefault()
          onScanRef.current(code)
        }
        return
      }

      // Single printable char
      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [minLength, maxGapMs, pauseWhenInputFocused])
}
