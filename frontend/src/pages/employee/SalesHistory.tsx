import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime, formatGhs } from '@/lib/formatters'
import { Badge } from '@/components/ui/Badge'

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my-sales').then((r) => setOrders(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">My Sales</h1>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <EmptyState title="No sales recorded" description="Record your first sale to see it here." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr><th className="px-4 py-3">Order #</th><th>Time</th><th>Items</th><th>Method</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="text-night-500">{formatDateTime(o.created_at)}</td>
                  <td>{o.items?.length ?? 0}</td>
                  <td><Badge variant="info">{o.payment_method}</Badge></td>
                  <td className="font-semibold">{formatGhs(o.total_kobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
