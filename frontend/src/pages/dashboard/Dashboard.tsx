import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, ShoppingBag, Truck } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { formatGhs, formatDate } from '@/lib/formatters'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  const recent = orders.slice(0, 5)
  const totalSpend = orders.filter((o) => o.payment_status === 'PAID').reduce((s, o) => s + o.total_kobo, 0)
  const active = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status))
  const liveOrder = active[0]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">
          {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Overview'}
        </h1>
        <p className="mt-1 text-night-600">
          {orders.length > 0
            ? `You've placed ${orders.length} order${orders.length === 1 ? '' : 's'} with us.`
            : 'Your orders, events and account at a glance.'}
        </p>
      </div>

      {/* Primary surface: live order if any, else a browse CTA. One emphasized
          thing instead of three equal metric cards. */}
      {liveOrder ? (
        <Link
          to={`/dashboard/orders/${liveOrder.id}/track`}
          className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-flame to-flame-700 p-6 text-white shadow-flame-lg transition-transform hover:-translate-y-0.5 noise"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" /> In progress
            </span>
            <p className="display mt-3 text-2xl font-bold">Order {liveOrder.order_number}</p>
            <p className="mt-1 text-sm text-white/80">{formatGhs(liveOrder.total_kobo)} · tap to track live</p>
          </div>
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-flame shadow-medium transition-transform group-hover:scale-110">
            <Truck className="h-6 w-6" />
          </div>
        </Link>
      ) : (
        <Link
          to="/products"
          className="group flex items-center justify-between rounded-3xl bg-night-900 p-6 text-white transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="eyebrow text-gold">Hungry?</p>
            <p className="display mt-2 text-2xl font-bold">Browse the menu</p>
            <p className="mt-1 text-sm text-white/70">Fresh cuts and ready-to-eat platters, delivered same day.</p>
          </div>
          <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {/* Compact stat strip — not three equal cards. A single bordered row. */}
      <div className="flex flex-wrap items-stretch divide-night-100 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-night-100 sm:divide-x">
        <div className="flex-1 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Total spend</p>
          <p className="display mt-1 text-2xl font-bold text-flame tabular-nums">{formatGhs(totalSpend)}</p>
        </div>
        <div className="flex-1 border-t border-night-100 px-5 py-4 sm:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Orders</p>
          <p className="display mt-1 text-2xl font-bold tabular-nums">{orders.length}</p>
        </div>
        <div className="flex-1 border-t border-night-100 px-5 py-4 sm:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Active</p>
          <p className="display mt-1 text-2xl font-bold tabular-nums">{active.length}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-flame hover:text-flame-700">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Place your first order to see it here."
            icon={<ShoppingBag className="h-8 w-8" />}
            action={<Link to="/products" className="btn btn-primary"><ShoppingBag className="h-4 w-4" /> Browse menu</Link>}
          />
        ) : (
          <ul className="divide-y divide-night-100">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/dashboard/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-cream -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-night-500">{o.order_number}</p>
                    <p className="text-sm font-semibold text-night-900">
                      {o.items?.length ?? 0} item{(o.items?.length ?? 0) === 1 ? '' : 's'} · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="display text-base font-bold tabular-nums">{formatGhs(o.total_kobo)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Events nudge — plain, no decorative gradient */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-night-900">Pork events</p>
            <p className="text-sm text-night-600">Monthly eat-and-drink nights — book your seat.</p>
          </div>
        </div>
        <Link to="/events" className="btn btn-gold shrink-0">See events</Link>
      </div>
    </div>
  )
}
