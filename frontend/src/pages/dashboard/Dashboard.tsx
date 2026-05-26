import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { formatGhs, formatDate } from '@/lib/formatters'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  const recent = orders.slice(0, 5)
  const totalSpend = orders.filter((o) => o.payment_status === 'PAID').reduce((s, o) => s + o.total_kobo, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Overview</h1>
        <p className="mt-1 text-night-600">Your orders, events and account at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-night-500">Total orders</p>
          <p className="mt-1 text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-night-500">Total spend</p>
          <p className="mt-1 text-3xl font-bold text-flame">{formatGhs(totalSpend)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-night-500">Active orders</p>
          <p className="mt-1 text-3xl font-bold">
            {orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/dashboard/orders" className="text-sm font-semibold text-flame hover:underline">View all →</Link>
        </div>
        {loading ? <LoadingSpinner /> : recent.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Place your first order to see it here."
            icon={<ShoppingBag className="h-8 w-8" />}
            action={<Link to="/products" className="btn btn-primary"><ShoppingBag className="h-4 w-4" /> Browse menu</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-night-500">
                <tr><th className="py-2">Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-night-100">
                    <td className="py-3 font-mono text-xs">{o.order_number}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{o.items?.length ?? 0}</td>
                    <td className="font-semibold">{formatGhs(o.total_kobo)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td>
                      <Link to={`/dashboard/orders/${o.id}`} className="inline-flex items-center gap-1 text-flame hover:underline">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card flex items-center justify-between bg-gradient-to-r from-gold/10 to-flame/10">
        <div>
          <p className="font-semibold">Discover Pork Events</p>
          <p className="text-sm text-night-600">Monthly eat-and-drink nights — book your seat.</p>
        </div>
        <Link to="/events" className="btn btn-gold"><Calendar className="h-4 w-4" /> See events</Link>
      </div>
    </div>
  )
}
