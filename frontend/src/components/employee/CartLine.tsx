import { Minus, Plus, Tag, X } from 'lucide-react'
import type { Product } from '@/types'
import { formatGhs } from '@/lib/formatters'

interface Props {
  product: Product
  quantity: number
  lineDiscountKobo: number
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
  /** Omit to hide the discount button (no permission). */
  onDiscount?: () => void
}

/**
 * One row in the POS cart. Compact, finger-friendly.
 *  – Big +/- buttons (h-9 = 36px, plenty for thumbs)
 *  – Strike-through unit price when a line discount is applied
 *  – Tag icon opens the line discount modal
 *  – X removes the line entirely
 */
export function CartLine({
  product,
  quantity,
  lineDiscountKobo,
  onIncrement,
  onDecrement,
  onRemove,
  onDiscount,
}: Props) {
  const gross = product.price_kobo * quantity
  const net   = gross - lineDiscountKobo

  return (
    <div className="flex items-start gap-2 rounded-xl border border-night-100 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-night-900" title={product.name}>
          {product.name}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-night-500">
          {formatGhs(product.price_kobo)} ea
        </p>

        {/* Quantity + line discount controls */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="inline-flex items-center rounded-full bg-night-100">
            <button
              type="button"
              onClick={onDecrement}
              className="grid h-8 w-8 place-items-center rounded-full text-night-700 cursor-pointer transition-colors hover:bg-night-200 hover:text-flame"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[28px] text-center text-sm font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={onIncrement}
              className="grid h-8 w-8 place-items-center rounded-full text-night-700 cursor-pointer transition-colors hover:bg-night-200 hover:text-flame"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {onDiscount && (
            <button
              type="button"
              onClick={onDiscount}
              className={`grid h-8 w-8 place-items-center rounded-full cursor-pointer transition-colors
                ${lineDiscountKobo > 0
                  ? 'bg-gold/20 text-gold-700 hover:bg-gold/30'
                  : 'bg-night-100 text-night-600 hover:bg-night-200'}`}
              aria-label={lineDiscountKobo > 0 ? 'Edit line discount' : 'Add line discount'}
              title={lineDiscountKobo > 0 ? `Discount: -${formatGhs(lineDiscountKobo)}` : 'Add discount'}
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: totals + remove */}
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-night-400 cursor-pointer hover:bg-flame-50 hover:text-flame"
          aria-label="Remove from cart"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="text-right">
          {lineDiscountKobo > 0 && (
            <p className="text-[10px] text-night-400 line-through tabular-nums">
              {formatGhs(gross)}
            </p>
          )}
          <p className="display text-base font-bold text-night-900 tabular-nums">
            {formatGhs(net)}
          </p>
          {lineDiscountKobo > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              Saved {formatGhs(lineDiscountKobo)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
