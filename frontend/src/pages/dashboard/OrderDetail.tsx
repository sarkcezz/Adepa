import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, RotateCcw, XCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order, Product } from '@/types'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs, formatDateTime } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add = useCartStore((s) => s.add)
  const clear = useCartStore((s) => s.clear)

  const [order, setOrder]     = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).finally(() => setLoading(false))
  }, [id])

  // Reorder: rebuild the cart from this order's items, then go to checkout.
  // We fetch each product fresh so prices/availability are current rather
  // than reusing the historical snapshot stored on the order.
  async function reorder() {
    if (!order?.items?.length) return
    setReordering(true)
    try {
      const products = await Promise.all(
        order.items.map((it) =>
          api.get<Product>(`/products/${it.product_id}`).then((r) => r.data).catch(() => null),
        ),
      )
      const available = products.filter((p): p is Product => Boolean(p) && (p as Product).is_active)
      if (available.length === 0) {
        toast.error('None of these items are available right now.')
        return
      }
      clear()
      order.items.forEach((it) => {
        const p = available.find((x) => x.id === it.product_id)
        if (p) add(p, it.quantity)
      })
      const skipped = order.items.length - available.length
      toast.success(skipped > 0 ? `Added ${available.length} item(s); ${skipped} unavailable.` : 'Added to cart.')
      navigate('/checkout')
    } catch {
      toast.error('Could not rebuild your cart.')
    } finally {
      setReordering(false)
    }
  }

  async function cancel() {
    if (!order) return
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setCancelling(true)
    try {
      const r = await api.post(`/orders/${order.id}/cancel`)
      setOrder(r.data)
      toast.success('Order cancelled.')
    } catch {
      // axios interceptor surfaces the 422 message
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!order) return <p>Order not found.</p>

  const isPending = order.status === 'PENDING'
  const isActive  = !['DELIVERED', 'CANCELLED'].includes(order.status)

  return (
    <div className="space-y-6">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="display-2 mt-1">{order.order_number}</h1>
          <p className="mt-1 text-sm text-night-500">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {isActive && (
            <Link to={`/dashboard/orders/${order.id}/track`}>
              <Button variant="outline"><Activity className="h-4 w-4" /> Live tracking</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-night-500">Order progress</h2>
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-night-500">Items</h2>
          <ul className="divide-y divide-night-100">
            {order.items?.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-night-900">{it.product_name}</p>
                  <p className="text-xs text-night-500">
                    {it.product_variant !== 'NONE' && it.product_variant} {it.weight_grams && `• ${it.weight_grams}g`} • Qty {it.quantity}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{formatGhs(it.subtotal_kobo)}</span>
              </li>
            ))}
          </ul>

          {/* Reorder — the highest-intent returning-customer action */}
          <div className="mt-5 border-t border-night-100 pt-4">
            <Button variant="outline" onClick={reorder} loading={reordering}>
              <RotateCcw className="h-4 w-4" /> Order again
            </Button>
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-night-500">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-night-500">Subtotal</dt><dd className="tabular-nums">{formatGhs(order.subtotal_kobo)}</dd></div>
            <div className="flex justify-between"><dt className="text-night-500">Delivery</dt><dd className="tabular-nums">{order.delivery_fee_kobo === 0 ? 'Free' : formatGhs(order.delivery_fee_kobo)}</dd></div>
            {order.discount_kobo > 0 && (
              <div className="flex justify-between text-green-700"><dt>Discount</dt><dd className="tabular-nums">− {formatGhs(order.discount_kobo)}</dd></div>
            )}
            <div className="flex justify-between border-t border-night-100 pt-2 text-base font-bold">
              <dt>Total</dt><dd className="text-flame tabular-nums">{formatGhs(order.total_kobo)}</dd>
            </div>
            <div className="border-t border-night-100 pt-3 text-xs text-night-500">
              <p>Payment: {order.payment_method} ({order.payment_status})</p>
              <p>Delivery: {order.delivery_method}</p>
            </div>
          </dl>

          {/* Cancel — only while still cancellable */}
          {isPending && (
            <button
              onClick={cancel}
              disabled={cancelling}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
