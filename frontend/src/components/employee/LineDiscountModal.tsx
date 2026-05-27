import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatGhs } from '@/lib/formatters'

interface Props {
  open: boolean
  onClose: () => void
  productName: string
  lineGrossKobo: number       // qty × unit_price
  currentDiscountKobo: number
  onApply: (discountKobo: number) => void
}

/**
 * Edit a single line's discount. Supports either a fixed-GHS amount or a
 * percentage. Auto-clamped to never exceed the line gross.
 */
export function LineDiscountModal({
  open, onClose, productName, lineGrossKobo, currentDiscountKobo, onApply,
}: Props) {
  const [mode, setMode]   = useState<'PERCENT' | 'GHS'>('GHS')
  const [value, setValue] = useState<string>('0')

  useEffect(() => {
    if (open) {
      // Default to current discount expressed as GHS
      setMode('GHS')
      setValue((currentDiscountKobo / 100).toFixed(2))
    }
  }, [open, currentDiscountKobo])

  const numericValue = Math.max(0, parseFloat(value) || 0)
  const calculatedKobo = mode === 'PERCENT'
    ? Math.round((lineGrossKobo * Math.min(100, numericValue)) / 100)
    : Math.round(numericValue * 100)
  const clampedKobo = Math.min(lineGrossKobo, calculatedKobo)

  function apply() {
    onApply(clampedKobo)
    onClose()
  }

  function clear() {
    onApply(0)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Line discount — ${productName}`} size="sm">
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-night-100 p-1">
          {(['GHS', 'PERCENT'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors
                ${mode === m ? 'bg-white text-flame shadow-soft' : 'text-night-600 hover:text-night-900'}`}
            >
              {m === 'GHS' ? 'Fixed (GHS)' : 'Percent (%)'}
            </button>
          ))}
        </div>

        <Input
          label={mode === 'GHS' ? 'Discount in GHS' : 'Discount in %'}
          type="number"
          inputMode="decimal"
          min={0}
          step={mode === 'PERCENT' ? 1 : 0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />

        {/* Summary */}
        <div className="rounded-xl bg-cream p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-night-600">Line gross</span>
            <span className="font-semibold tabular-nums">{formatGhs(lineGrossKobo)}</span>
          </div>
          <div className="flex justify-between text-flame">
            <span>Discount</span>
            <span className="font-semibold tabular-nums">-{formatGhs(clampedKobo)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-night-200 pt-2 text-base font-bold">
            <span>Line net</span>
            <span className="display tabular-nums">{formatGhs(lineGrossKobo - clampedKobo)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clear} className="flex-1">Clear</Button>
          <Button onClick={apply} className="flex-1">Apply</Button>
        </div>
      </div>
    </Modal>
  )
}
