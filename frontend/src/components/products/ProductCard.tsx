import { Link } from 'react-router-dom'
import { Flame, ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { formatGhs, formatWeight } from '@/lib/formatters'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

export function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-night-100 transition-all hover:shadow-lg hover:ring-flame/20">
      <Link to={`/products/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-cream">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {product.product_line === 'READY_TO_EAT' ? '🍖' : product.product_line === 'SPICED' ? '🌶️' : '🥩'}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1.5">
          {product.heat_level > 0 &&
            Array.from({ length: product.heat_level }).map((_, i) => (
              <Flame key={i} className="h-3.5 w-3.5 text-flame" />
            ))}
          {product.variant !== 'NONE' && (
            <span className="ml-auto text-xs font-medium uppercase tracking-wide text-night-400">{product.variant}</span>
          )}
        </div>

        <Link to={`/products/${product.id}`} className="mb-1 text-base font-semibold text-night-900 hover:text-flame">
          {product.name}
        </Link>
        {product.weight_grams && (
          <p className="mb-3 text-xs text-night-500">{formatWeight(product.weight_grams)}</p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-flame">{formatGhs(product.price_kobo)}</span>
          <button
            onClick={() => { add(product); toast.success(`${product.name} added to cart`) }}
            className="rounded-full bg-night-900 p-2.5 text-white transition-colors hover:bg-flame"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
