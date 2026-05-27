import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Camera, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void
}

/**
 * Camera-based barcode scanner using the native BarcodeDetector API where
 * available (Chrome/Edge on Android, modern Safari). Falls back to a clear
 * message + advice to use a hardware scanner when not supported.
 */
export function BarcodeScannerModal({ open, onClose, onScan }: Props) {
  const videoRef    = useRef<HTMLVideoElement | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef      = useRef<number | null>(null)

  const [supported, setSupported] = useState<boolean | null>(null)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function start() {
      // 1. Feature detect
      // @ts-expect-error BarcodeDetector isn't in TS lib yet
      const hasDetector = typeof window.BarcodeDetector !== 'undefined'
      if (!hasDetector) {
        setSupported(false)
        return
      }

      try {
        // @ts-expect-error see above
        const detector = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'],
        })
        detectorRef.current = detector

        // 2. Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setSupported(true)

        // 3. Scan loop — ~5fps is plenty for barcodes
        let lastScan = 0
        const tick = async () => {
          if (cancelled || !videoRef.current || !detectorRef.current) return
          const now = performance.now()
          if (now - lastScan > 200) {
            lastScan = now
            try {
              const codes = await detectorRef.current.detect(videoRef.current)
              if (codes && codes.length > 0) {
                const code = codes[0].rawValue as string
                if (code) {
                  onScan(code)
                  onClose()
                  return
                }
              }
            } catch {
              // Per-frame detection failures are noisy and harmless; ignore.
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (e: any) {
        setError(e?.message || 'Could not access the camera.')
        setSupported(false)
      }
    }

    start()

    // Cleanup
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      detectorRef.current = null
    }
  }, [open, onClose, onScan])

  return (
    <Modal open={open} onClose={onClose} title="Scan barcode" size="md">
      <div className="space-y-4">
        {supported === null && (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-night-100">
            <p className="text-sm text-night-500">Starting camera…</p>
          </div>
        )}

        {supported === true && (
          <>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-night-900 ring-1 ring-night-200">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              {/* Aiming frame */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-32 w-3/4 rounded-xl border-2 border-flame/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
            </div>
            <p className="text-center text-xs text-night-500">
              Hold the barcode inside the frame.
            </p>
          </>
        )}

        {supported === false && (
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">Camera scanning isn't available on this device.</p>
                <p className="mt-1 text-amber-800">
                  {error || 'Your browser doesn\'t support the BarcodeDetector API.'}
                </p>
                <p className="mt-3 text-amber-800">
                  <Camera className="mr-1 inline h-4 w-4" />
                  USB / Bluetooth barcode scanners still work — just point and scan,
                  the POS will detect it automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
