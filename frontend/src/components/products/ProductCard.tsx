import { Link } from 'react-router-dom'
import { Flame, Plus } from 'lucide-react'
import type { Product } from '@/types'
import { formatGhs, formatWeight } from '@/lib/formatters'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import { PorkMark } from '@/components/common/PorkMark'

export function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add)

  const markVariant =
    product.product_line === 'READY_TO_EAT' ? 'ready' :
    product.product_line === 'SPICED'       ? 'spiced' : 'raw'

  const lineLabel =
    product.product_line === 'READY_TO_EAT' ? 'Ready to Eat' :
    product.product_line === 'SPICED'       ? 'Spiced'       : 'Raw Cut'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-night-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-medium hover:ring-flame/20">
      {/* Image */}
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream"
        aria-label={`View ${product.name}`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <PorkMark variant={markVariant} />
        )}

        {/* Product-line tag, top-left */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-night-800 shadow-soft backdrop-blur">
          {lineLabel}
        </span>

        {/* Heat indicator, top-right */}
        {product.heat_level > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-flame px-2 py-1 text-white shadow-flame">
            {Array.from({ length: product.heat_level }).map((_, i) => (
              <Flame key={i} className="h-3 w-3" aria-hidden="true" />
            ))}
            <span className="sr-only">Heat level {product.heat_level} of 3</span>
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <Link
            to={`/products/${product.id}`}
            className="display text-lg font-semibold leading-tight text-night-900 transition-colors hover:text-flame"
          >
            {product.name}
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs text-night-500">
          {product.weight_grams && <span>{formatWeight(product.weight_grams)}</span>}
          {product.weight_grams && product.variant !== 'NONE' && <span aria-hidden="true">•</span>}
          {product.variant !== 'NONE' && (
            <span className="uppercase tracking-wider">{product.variant.replace('_', ' ').toLowerCase()}</span>
          )}
        </div>

        {/* Price + add */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-night-400">From</p>
            <p className="display text-2xl font-bold text-flame leading-none">
              {formatGhs(product.price_kobo)}
            </p>
          </div>
          <button
            onClick={() => {
              add(product)
              toast.success(`${product.name} added to cart`)
            }}
            className="flex items-center gap-1.5 rounded-full bg-night-900 px-4 py-2.5 text-xs font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-flame hover:shadow-flame active:scale-[0.97]"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </article>
  )
}
