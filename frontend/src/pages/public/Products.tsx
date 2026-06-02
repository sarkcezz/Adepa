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

const SIZES: { value: 'ALL' | 'small' | 'medium' | 'large'; label: string }[] = [
  { value: 'ALL',    label: 'Any size' },
  { value: 'small',  label: '≤ 500g' },
  { value: 'medium', label: '500g–2kg' },
  { value: 'large',  label: '> 2kg' },
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

  const pill = (selected: boolean, tone: 'flame' | 'gold' = 'flame') =>
    cn(
      'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
      selected
        ? tone === 'flame' ? 'bg-flame text-white shadow-flame' : 'bg-gold text-night-900 shadow-gold'
        : 'bg-white text-night-700 ring-1 ring-night-200 hover:text-flame hover:ring-flame/30',
    )

  return (
    <div className="container-tight py-10">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Our menu</p>
        <h1 className="display-2 mt-2">Pick your flavour</h1>
        <p className="mt-2 text-night-600">From butcher-clean raw cuts to fire-grilled ready-to-eat platters.</p>
      </div>

      {/* Filters — consistent pill controls, grouped by row */}
      <div className="mb-6 space-y-3 border-b border-night-100 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-night-500">
            <Filter className="h-3.5 w-3.5" /> Line
          </span>
          {LINES.map((l) => (
            <button key={l.value} onClick={() => setLine(l.value)} className={pill(line === l.value)}>
              {l.label}
            </button>
          ))}
        </div>

        {line === 'SPICED' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-night-500">Heat</span>
            {VARIANTS.map((v) => (
              <button key={v.value} onClick={() => setVariant(v.value)} className={pill(variant === v.value, 'gold')}>
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-night-500">Size</span>
          {SIZES.map((s) => (
            <button key={s.value} onClick={() => setSize(s.value)} className={pill(size === s.value)}>
              {s.label}
            </button>
          ))}
        </div>
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
