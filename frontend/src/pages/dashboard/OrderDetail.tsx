import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Activity } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs, formatDateTime } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!order) return <p>Order not found.</p>

  return (
    <div className="space-y-6">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Order {order.order_number}</h1>
          <p className="mt-1 text-sm text-night-500">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
            <Link to={`/dashboard/orders/${order.id}/track`}>
              <Button variant="outline"><Activity className="h-4 w-4" /> Live tracking</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-6 text-lg font-semibold">Order progress</h2>
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Items</h2>
          <ul className="divide-y divide-night-100">
            {order.items?.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{it.product_name}</p>
                  <p className="text-xs text-night-500">
                    {it.product_variant !== 'NONE' && it.product_variant} {it.weight_grams && `• ${it.weight_grams}g`} • Qty {it.quantity}
                  </p>
                </div>
                <span className="font-semibold">{formatGhs(it.subtotal_kobo)}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="card h-fit">
          <h2 className="mb-4 text-lg font-semibold">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-night-500">Subtotal</dt><dd>{formatGhs(order.subtotal_kobo)}</dd></div>
            <div className="flex justify-between"><dt className="text-night-500">Delivery</dt><dd>{formatGhs(order.delivery_fee_kobo)}</dd></div>
            {order.discount_kobo > 0 && (
              <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>− {formatGhs(order.discount_kobo)}</dd></div>
            )}
            <div className="flex justify-between border-t border-night-100 pt-2 text-base font-bold">
              <dt>Total</dt><dd className="text-flame">{formatGhs(order.total_kobo)}</dd>
            </div>
            <div className="border-t border-night-100 pt-3 text-xs text-night-500">
              <p>Payment: {order.payment_method} ({order.payment_status})</p>
              <p>Delivery: {order.delivery_method}</p>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
