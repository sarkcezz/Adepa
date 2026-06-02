import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Flame, Minus, Plus, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatGhs, formatWeight } from '@/lib/formatters'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useCartStore } from '@/store/cartStore'
import { PorkMark } from '@/components/common/PorkMark'
import { toast } from 'sonner'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty,     setQty]     = useState(1)
  const add = useCartStore((s) => s.add)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/products/${id}`).then((r) => setProduct(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!product) return <div className="container-tight py-20 text-center">Product not found.</div>

  return (
    <div className="container-tight py-8">
      <Link to="/products" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-cream ring-1 ring-night-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <PorkMark
              variant={product.product_line === 'READY_TO_EAT' ? 'ready' : product.product_line === 'SPICED' ? 'spiced' : 'raw'}
            />
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="eyebrow">{product.product_line.replace('_', ' ').toLowerCase()}</span>
            {product.variant !== 'NONE' && (
              <span className="text-xs font-medium uppercase tracking-wider text-night-500">{product.variant}</span>
            )}
            {product.heat_level > 0 && (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: product.heat_level }).map((_, i) => <Flame key={i} className="h-3.5 w-3.5 text-flame" />)}
              </span>
            )}
          </div>

          <h1 className="display-2 mb-2">{product.name}</h1>
          {product.weight_grams && <p className="mb-4 text-sm text-night-500">{formatWeight(product.weight_grams)}</p>}

          <p className="mb-6 text-3xl font-bold text-flame">{formatGhs(product.price_kobo)}</p>

          <p className="mb-6 leading-relaxed text-night-700">{product.description}</p>

          {product.ingredients && (
            <div className="mb-5">
              <h3 className="mb-1 text-sm font-semibold text-night-900">Ingredients</h3>
              <p className="text-sm text-night-600">{product.ingredients}</p>
            </div>
          )}

          {product.storage_instructions && (
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-semibold text-night-900">Storage</h3>
              <p className="text-sm text-night-600">{product.storage_instructions}</p>
            </div>
          )}

          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium text-night-700">Quantity</span>
            <div className="flex items-center gap-2 rounded-lg ring-1 ring-night-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-night-50"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-night-50"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => { add(product, qty); toast.success(`${product.name} × ${qty} added to cart`) }}
          >
            <ShoppingBag className="h-5 w-5" /> Add to cart — {formatGhs(product.price_kobo * qty)}
          </Button>
        </div>
      </div>
    </div>
  )
}
