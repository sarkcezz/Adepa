import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatGhs } from '@/lib/formatters'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">My Orders</h1>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="When you place an order it'll show up here." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-night-100 hover:bg-cream/50">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{o.items?.length ?? 0}</td>
                  <td className="font-semibold">{formatGhs(o.total_kobo)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4">
                    <Link to={`/dashboard/orders/${o.id}`} className="text-sm font-semibold text-flame hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
