import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ScanLine, Pause, Tag, X, MapPin, User as UserIcon,
  Trash2, ChevronDown, ChevronUp, ShoppingBag,
} from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatGhs } from '@/lib/formatters'
import { toast } from 'sonner'

import { ProductTile } from '@/components/employee/ProductTile'
import { CartLine } from '@/components/employee/CartLine'
import { PaymentPicker } from '@/components/employee/PaymentPicker'
import { BarcodeScannerModal } from '@/components/employee/BarcodeScannerModal'
import { LineDiscountModal } from '@/components/employee/LineDiscountModal'
import { HoldCartsDrawer } from '@/components/employee/HoldCartsDrawer'
import { OfflineBanner } from '@/components/employee/OfflineBanner'

import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { useHeldCarts } from '@/hooks/useHeldCarts'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'

interface CartItem {
  product_id: string
  quantity: number
  line_discount_kobo: number
}

const LINES = ['All', 'RAW', 'SPICED', 'READY_TO_EAT'] as const
type LineFilter = (typeof LINES)[number]

const STAND_KEY  = 'adepa-pos-stand'
const RECENT_KEY = 'adepa-pos-recent'

function readStand() { return localStorage.getItem(STAND_KEY) || '' }
function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

export default function RecordSale() {
  const navigate = useNavigate()

  // ── Products ──────────────────────────────────────────────────────────
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<LineFilter>('All')

  // ── Cart ──────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([])

  // ── Customer + payment ────────────────────────────────────────────────
  const [customerPhone,  setCustomerPhone]  = useState('')
  const [customerName,   setCustomerName]   = useState('')
  const [paymentMethod,  setPaymentMethod]  = useState<'CASH'|'MOMO'|'CARD'>('CASH')
  const [paymentRef,     setPaymentRef]     = useState('')
  const [promoCode,      setPromoCode]      = useState('')
  const [showOptional,   setShowOptional]   = useState(false)
  const [stand, setStand]                   = useState(readStand())

  // ── UI state ──────────────────────────────────────────────────────────
  const [submitting,    setSubmitting]    = useState(false)
  const [scannerOpen,   setScannerOpen]   = useState(false)
  const [discountFor,   setDiscountFor]   = useState<string | null>(null)
  const [holdsOpen,     setHoldsOpen]     = useState(false)
  const [recentIds,     setRecentIds]     = useState<string[]>(readRecent())

  // ── Hooks ─────────────────────────────────────────────────────────────
  const offline = useOfflineQueue()
  const holds   = useHeldCarts()

  const searchRef = useRef<HTMLInputElement | null>(null)

  // Load products once
  useEffect(() => {
    api.get('/products', { params: { active_only: 1 } })
      .then((r) => setProducts(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  // Persist stand name
  useEffect(() => { if (stand) localStorage.setItem(STAND_KEY, stand) }, [stand])

  // ── Cart ops ──────────────────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, { product_id: product.id, quantity: 1, line_discount_kobo: 0 }]
    })
    toast.success(`Added ${product.name}`, { duration: 800 })
  }, [])

  const increment = (id: string) =>
    setCart((p) => p.map((l) => l.product_id === id ? { ...l, quantity: l.quantity + 1 } : l))
  const decrement = (id: string) =>
    setCart((p) =>
      p.flatMap((l) => {
        if (l.product_id !== id) return [l]
        if (l.quantity <= 1) return []
        return [{ ...l, quantity: l.quantity - 1 }]
      }),
    )
  const removeLine = (id: string) =>
    setCart((p) => p.filter((l) => l.product_id !== id))
  const setLineDiscount = (id: string, discount: number) =>
    setCart((p) => p.map((l) => l.product_id === id ? { ...l, line_discount_kobo: discount } : l))

  const clearCart = () => {
    if (cart.length === 0) return
    if (!confirm('Clear current cart?')) return
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setPaymentMethod('CASH')
    setPaymentRef('')
    setPromoCode('')
  }

  // ── Barcode → cart ────────────────────────────────────────────────────
  const handleScan = useCallback((code: string) => {
    // Match by exact id, then by name (case-insensitive, partial)
    const lower = code.toLowerCase().trim()
    const match = products.find((p) => p.id === code) ||
                  products.find((p) => p.name.toLowerCase() === lower) ||
                  products.find((p) => p.name.toLowerCase().includes(lower))
    if (match) {
      addToCart(match)
    } else {
      toast.error(`No product matches "${code}"`)
    }
  }, [products, addToCart])

  useBarcodeScanner({ onScan: handleScan })

  // ── Customer lookup (debounced) ───────────────────────────────────────
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 8) {
      setCustomerName('')
      return
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/orders/customer-lookup', { params: { phone: customerPhone } })
        if (data.customer) {
          setCustomerName(data.customer.name)
        } else {
          setCustomerName('')
        }
      } catch {
        // ignore — non-blocking
      }
    }, 400)
    return () => clearTimeout(t)
  }, [customerPhone])

  // ── Totals ────────────────────────────────────────────────────────────
  const { subtotal, totalDiscount, total } = useMemo(() => {
    let sub = 0, disc = 0
    for (const l of cart) {
      const p = products.find((x) => x.id === l.product_id)
      if (!p) continue
      sub += p.price_kobo * l.quantity
      disc += l.line_discount_kobo
    }
    return { subtotal: sub, totalDiscount: disc, total: Math.max(0, sub - disc) }
  }, [cart, products])

  // ── Filtered products ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const lower = search.toLowerCase().trim()
    return products.filter((p) => {
      if (filter !== 'All' && p.product_line !== filter) return false
      if (!lower) return true
      return (
        p.name.toLowerCase().includes(lower) ||
        p.variant.toLowerCase().includes(lower) ||
        p.product_line.toLowerCase().includes(lower)
      )
    })
  }, [products, search, filter])

  // Recent products (last 5 sold) - shown above the grid
  const recentProducts = useMemo(() => {
    return recentIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 5)
  }, [recentIds, products])

  // ── Cart lookup helpers ───────────────────────────────────────────────
  const qtyInCart = useCallback((id: string) =>
    cart.find((l) => l.product_id === id)?.quantity || 0, [cart])

  // ── Hold / Resume ─────────────────────────────────────────────────────
  function hold() {
    if (cart.length === 0) return toast.error('Cart is empty.')
    holds.hold({
      items: cart,
      customer_phone: customerPhone || undefined,
      customer_name: customerName || undefined,
      promo_code: promoCode || undefined,
      payment_method: paymentMethod,
      payment_reference: paymentRef || undefined,
    })
    toast.success('Cart held. Open "Holds" to resume.')
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setPromoCode('')
    setPaymentRef('')
  }

  function resume(id: string) {
    const c = holds.resume(id)
    if (!c) return
    setCart(c.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      line_discount_kobo: i.line_discount_kobo || 0,
    })))
    setCustomerPhone(c.customer_phone || '')
    setCustomerName(c.customer_name || '')
    setPaymentMethod(c.payment_method)
    setPaymentRef(c.payment_reference || '')
    setPromoCode(c.promo_code || '')
    setHoldsOpen(false)
    if (c.customer_phone || c.promo_code) setShowOptional(true)
    toast.success(`Resumed: ${c.name}`)
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function submit() {
    if (cart.length === 0) return toast.error('Cart is empty.')
    if (paymentMethod !== 'CASH' && !paymentRef.trim()) {
      return toast.error(`Enter the ${paymentMethod} reference.`)
    }

    setSubmitting(true)

    const payload = {
      items: cart.map((l) => ({
        product_id: l.product_id,
        quantity:   l.quantity,
        line_discount_kobo: l.line_discount_kobo || 0,
      })),
      customer_phone: customerPhone || undefined,
      payment_method: paymentMethod,
      payment_reference: paymentRef || undefined,
      promo_code: promoCode || undefined,
      stand_name: stand || undefined,
    }

    try {
      // Try direct submit first. If offline OR submit fails on network, queue it.
      if (!offline.online) {
        await offline.enqueue(payload)
        toast.success('Saved offline. Will sync when you reconnect.')
        recordRecents(cart)
        setCart([])
        setSubmitting(false)
        return
      }

      const r = await api.post('/orders/employee-sale', payload)
      toast.success(`Sale ${r.data.order_number} recorded.`)
      recordRecents(cart)
      navigate(`/employee/sale/${r.data.id}/receipt`)
    } catch (e: any) {
      // Network failure → queue. HTTP error → bubble up.
      if (!e?.response) {
        await offline.enqueue(payload)
        toast.success('Saved offline. Will sync when you reconnect.')
        recordRecents(cart)
        setCart([])
      }
    } finally {
      setSubmitting(false)
    }
  }

  function recordRecents(items: CartItem[]) {
    const ids = items.map((i) => i.product_id)
    const merged = [...ids, ...recentIds].filter((id, i, arr) => arr.indexOf(id) === i).slice(0, 5)
    setRecentIds(merged)
    localStorage.setItem(RECENT_KEY, JSON.stringify(merged))
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip if a form input has focus
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
      const editable = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable

      if (e.key === '/' && !editable) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape' && !editable) {
        clearCart()
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, paymentMethod, paymentRef])

  const discountedProduct = discountFor
    ? products.find((p) => p.id === discountFor) || null : null
  const discountedLine = discountFor
    ? cart.find((l) => l.product_id === discountFor) : null

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 sm:h-[calc(100vh-5rem)] lg:flex-row">
      {/* ─── PRODUCT BROWSE ──────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Header bar */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display text-xl font-bold sm:text-2xl">Sell</h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => setHoldsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night-700 ring-1 ring-night-200 cursor-pointer hover:bg-flame-50 hover:text-flame hover:ring-flame/30"
            >
              <Pause className="h-3.5 w-3.5" />
              Holds
              {holds.count > 0 && (
                <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">
                  {holds.count}
                </span>
              )}
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night-700 ring-1 ring-night-200 cursor-pointer hover:bg-flame-50 hover:text-flame hover:ring-flame/30"
            >
              <ScanLine className="h-3.5 w-3.5" /> Scan
            </button>
          </div>
        </div>

        {/* Offline banner */}
        <OfflineBanner online={offline.online} pendingCount={offline.pending.length} onRetry={offline.flush} />

        {/* Stand name + search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-night-700 ring-1 ring-night-200">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-flame" />
            <input
              value={stand}
              onChange={(e) => setStand(e.target.value)}
              placeholder="Stand / location"
              className="bg-transparent w-32 outline-none placeholder:text-night-400 sm:w-48"
            />
          </div>

          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night-400" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search products… (press / to focus)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {LINES.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors
                ${filter === l
                  ? 'bg-flame text-white shadow-flame'
                  : 'bg-white text-night-700 ring-1 ring-night-200 hover:ring-flame/30 hover:text-flame'}`}
            >
              {l === 'All' ? 'All' : l === 'READY_TO_EAT' ? 'Ready-to-eat' : l.charAt(0) + l.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Recently sold strip */}
        {recentProducts.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-night-500">Recently sold · tap to add</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {recentProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="shrink-0 rounded-full bg-flame-50 px-3 py-1.5 text-xs font-semibold text-flame cursor-pointer transition-colors hover:bg-flame hover:text-white"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="grid h-40 place-items-center text-center text-sm text-night-500">
              No products match.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((p) => (
                <ProductTile
                  key={p.id}
                  product={p}
                  qtyInCart={qtyInCart(p.id)}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CART ────────────────────────────────────────────────────── */}
      <aside className="flex shrink-0 flex-col rounded-2xl bg-white p-4 shadow-medium ring-1 ring-night-100 lg:w-[400px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-flame" />
            <h2 className="display text-base font-bold">Cart</h2>
            <span className="rounded-full bg-flame text-white text-[10px] font-bold px-2 py-0.5">
              {cart.length}
            </span>
          </div>
          {cart.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={hold}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-night-700 cursor-pointer hover:bg-night-100"
              >
                <Pause className="h-3 w-3" /> Hold
              </button>
              <button
                onClick={clearCart}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-flame cursor-pointer hover:bg-flame-50"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-night-500">
              <div>
                <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-night-200" />
                <p>Tap a product to start.</p>
              </div>
            </div>
          ) : (
            cart.map((l) => {
              const p = products.find((x) => x.id === l.product_id)
              if (!p) return null
              return (
                <CartLine
                  key={l.product_id}
                  product={p}
                  quantity={l.quantity}
                  lineDiscountKobo={l.line_discount_kobo}
                  onIncrement={() => increment(l.product_id)}
                  onDecrement={() => decrement(l.product_id)}
                  onRemove={() => removeLine(l.product_id)}
                  onDiscount={() => setDiscountFor(l.product_id)}
                />
              )
            })
          )}
        </div>

        {/* Totals */}
        <div className="mt-3 space-y-1 border-t border-night-100 pt-3 text-sm">
          <div className="flex justify-between text-night-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatGhs(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-flame">
              <span>Line discounts</span>
              <span className="tabular-nums">-{formatGhs(totalDiscount)}</span>
            </div>
          )}
          <div className="flex items-end justify-between border-t border-night-100 pt-2">
            <span className="text-xs uppercase tracking-wider text-night-500">Total</span>
            <span className="display text-2xl font-bold text-flame tabular-nums">
              {formatGhs(total)}
            </span>
          </div>
        </div>

        {/* Optional fields — collapsed by default */}
        <div className="mt-3">
          <button
            onClick={() => setShowOptional((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg bg-night-50 px-3 py-2 text-xs font-semibold text-night-700 cursor-pointer hover:bg-night-100"
          >
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              Customer & promo (optional)
            </span>
            {showOptional ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showOptional && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Input
                  label="Customer phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0244…"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  hint={customerName ? `✓ ${customerName}` : undefined}
                />
              </div>
              <Input
                label="Promo code"
                placeholder="ADEPA10"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
            </div>
          )}
        </div>

        {/* Payment picker */}
        <div className="mt-3">
          <p className="label">Payment</p>
          <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
          {paymentMethod !== 'CASH' && (
            <Input
              className="mt-2"
              label={paymentMethod === 'MOMO' ? 'MoMo transaction ID' : 'Card reference'}
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
            />
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={submit}
          loading={submitting}
          disabled={cart.length === 0}
          size="xl"
          className="mt-4 w-full"
        >
          {cart.length === 0 ? 'Add items to start' : `Complete sale · ${formatGhs(total)}`}
        </Button>
        <p className="mt-2 text-center text-[10px] text-night-400">
          Press <kbd className="rounded bg-night-100 px-1 font-mono">Ctrl/⌘ + Enter</kbd> to submit
        </p>
      </aside>

      {/* ─── MODALS ──────────────────────────────────────────────────── */}
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      <LineDiscountModal
        open={!!discountedProduct && !!discountedLine}
        onClose={() => setDiscountFor(null)}
        productName={discountedProduct?.name || ''}
        lineGrossKobo={(discountedProduct?.price_kobo || 0) * (discountedLine?.quantity || 0)}
        currentDiscountKobo={discountedLine?.line_discount_kobo || 0}
        onApply={(d) => { if (discountFor) setLineDiscount(discountFor, d) }}
      />

      <HoldCartsDrawer
        open={holdsOpen}
        onClose={() => setHoldsOpen(false)}
        carts={holds.carts}
        onResume={resume}
        onDiscard={holds.discard}
      />

      {/* Mobile-only floating tag indicator for unused discount/promo */}
      {promoCode && (
        <div className="fixed bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1.5 text-xs font-semibold text-night-900 shadow-medium lg:hidden">
          <Tag className="h-3.5 w-3.5" />
          {promoCode}
          <button onClick={() => setPromoCode('')} aria-label="Remove promo">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
