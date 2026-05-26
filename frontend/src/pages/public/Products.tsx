import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product, ProductLine, ProductVariant } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { CardSkeleton } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'

const LINES: { value: ProductLine | 'ALL'; label: string }[] = [
  { value: 'ALL',          label: 'All' },
  { value: 'RAW',          label: 'Raw' },
  { value: 'SPICED',       label: 'Spiced' },
  { value: 'READY_TO_EAT', label: 'Ready-to-Eat' },
]

const VARIANTS: { value: ProductVariant | 'ALL'; label: string }[] = [
  { value: 'ALL',   label: 'All' },
  { value: 'PLAIN', label: 'Plain' },
  { value: 'MILD',  label: 'Mild' },
  { value: 'SPICY', label: 'Spicy' },
]

export default function Products() {
  const [items,   setItems]   = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [line,    setLine]    = useState<ProductLine | 'ALL'>('ALL')
  const [variant, setVariant] = useState<ProductVariant | 'ALL'>('ALL')
  const [size,    setSize]    = useState<'ALL' | 'small' | 'medium' | 'large'>('ALL')

  useEffect(() => {
    setLoading(true)
    api.get('/products').then((r) => setItems(r.data.data)).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (line !== 'ALL' && p.product_line !== line) return false
      if (variant !== 'ALL' && p.variant !== variant) return false
      if (size === 'small'  && (p.weight_grams ?? 0) > 500)  return false
      if (size === 'medium' && ((p.weight_grams ?? 0) <= 500 || (p.weight_grams ?? 0) > 2000)) return false
      if (size === 'large'  && (p.weight_grams ?? 0) <= 2000) return false
      return true
    })
  }, [items, line, variant, size])

  return (
    <div className="container-tight py-10">
      <div className="mb-8">
        <h1 className="display text-3xl font-bold sm:text-4xl">Our Menu</h1>
        <p className="mt-1 text-night-600">From raw cuts to ready-to-eat — pick your flavour.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-night-100">
        <Filter className="h-4 w-4 text-night-500" />
        <span className="text-sm font-medium text-night-700">Filter:</span>

        <div className="flex flex-wrap gap-1.5">
          {LINES.map((l) => (
            <button
              key={l.value}
              onClick={() => setLine(l.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                line === l.value ? 'bg-flame text-white' : 'bg-night-100 text-night-700 hover:bg-night-200',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {line === 'SPICED' && (
          <div className="flex flex-wrap gap-1.5">
            {VARIANTS.map((v) => (
              <button
                key={v.value}
                onClick={() => setVariant(v.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  variant === v.value ? 'bg-gold text-night-900' : 'bg-night-100 text-night-700 hover:bg-night-200',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <select
          value={size}
          onChange={(e) => setSize(e.target.value as any)}
          className="rounded-full border border-night-200 bg-white px-3 py-1 text-xs font-medium text-night-700"
        >
          <option value="ALL">Any size</option>
          <option value="small">Small (≤ 500g)</option>
          <option value="medium">Medium (500g – 2kg)</option>
          <option value="large">Large (&gt; 2kg)</option>
        </select>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No products match" description="Try changing your filters." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
