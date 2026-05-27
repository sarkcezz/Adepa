import { Flame } from 'lucide-react'
import type { Product } from '@/types'
import { formatGhs, formatWeight } from '@/lib/formatters'
import { PorkMark } from '@/components/common/PorkMark'

interface Props {
  product: Product
  qtyInCart?: number
  onAdd: (p: Product) => void
}

/**
 * Tappable product card for the POS grid. Single tap → +1 to cart.
 * Shows a flame badge for heat level, the qty already in cart, and a
 * stock warning when below 5 units.
 */
export function ProductTile({ product, qtyInCart = 0, onAdd }: Props) {
  const markVariant =
    product.product_line === 'READY_TO_EAT' ? 'ready' :
    product.product_line === 'SPICED'       ? 'spiced' : 'raw'

  const outOfStock = product.stock_qty === 0
  const lowStock   = !outOfStock && product.stock_qty < 5

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-soft ring-1 ring-night-100
        transition-all duration-200 cursor-pointer
        hover:-translate-y-0.5 hover:shadow-medium hover:ring-flame/30
        active:scale-[0.97] active:shadow-soft
        focus-visible:ring-2 focus-visible:ring-flame
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none`}
      aria-label={`Add ${product.name} to cart, ${formatGhs(product.price_kobo)}`}
    >
      {/* Top: image */}
      <div className="relative aspect-square overflow-hidden bg-cream">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PorkMark variant={markVariant} />
        )}

        {/* Heat level top-left */}
        {product.heat_level > 0 && (
          <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-flame px-1.5 py-0.5 text-white shadow-flame">
            {Array.from({ length: product.heat_level }).map((_, i) => (
              <Flame key={i} className="h-2.5 w-2.5" aria-hidden="true" />
            ))}
          </span>
        )}

        {/* Quantity-in-cart badge top-right */}
        {qtyInCart > 0 && (
          <span className="absolute right-2 top-2 grid h-7 min-w-7 place-items-center rounded-full bg-flame px-2 text-xs font-bold text-white shadow-flame">
            {qtyInCart}
          </span>
        )}

        {/* Stock corner badge */}
        {outOfStock && (
          <span className="absolute inset-0 grid place-items-center bg-night-900/60 text-xs font-bold uppercase tracking-wider text-white">
            Out of stock
          </span>
        )}
        {!outOfStock && lowStock && (
          <span className="absolute bottom-2 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
            {product.stock_qty} left
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-night-900">
          {product.name}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-night-500">
          {product.weight_grams ? formatWeight(product.weight_grams) : product.variant.replace('_', ' ').toLowerCase()}
        </p>
        <p className="display mt-2 text-base font-bold text-flame">
          {formatGhs(product.price_kobo)}
        </p>
      </div>
    </button>
  )
}
