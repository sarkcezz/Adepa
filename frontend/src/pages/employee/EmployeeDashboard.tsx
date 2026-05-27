import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, TrendingUp, DollarSign, ArrowRight, Printer } from 'lucide-react'
import { api } from '@/lib/axios'
import { MetricCard } from '@/components/admin/MetricCard'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { OfflineBanner } from '@/components/employee/OfflineBanner'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { useHeldCarts } from '@/hooks/useHeldCarts'
import { formatGhs, formatDateTime } from '@/lib/formatters'
import type { Order } from '@/types'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [summary,  setSummary]  = useState<any>(null)
  const [recent,   setRecent]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const offline = useOfflineQueue()
  const holds   = useHeldCarts()

  useEffect(() => {
    Promise.all([
      api.get('/orders/my-sales/summary'),
      api.get('/orders/my-sales'),
    ])
      .then(([s, r]) => {
        setSummary(s.data)
        setRecent((r.data.data || []).slice(0, 5))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">
          Hi {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm text-night-600">Ready to sell?</p>
      </div>

      {/* Banner if offline / queued */}
      <OfflineBanner
        online={offline.online}
        pendingCount={offline.pending.length}
        onRetry={offline.flush}
      />

      {/* Primary CTA — big, bold, can't miss */}
      <Link
        to="/employee/sale"
        className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-flame to-flame-700 p-6 text-white shadow-flame-lg transition-transform hover:-translate-y-0.5"
      >
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gold/30 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-gold">Start a sale</p>
          <h2 className="display mt-2 text-2xl font-bold sm:text-3xl">Open POS</h2>
          <p className="mt-1 max-w-xs text-sm text-white/80">
            Tap products, take payment, print receipt.
          </p>
          {holds.count > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              {holds.count} cart{holds.count > 1 ? 's' : ''} on hold
            </p>
          )}
        </div>
        <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-flame shadow-medium transition-transform group-hover:scale-110">
          <ArrowRight className="h-6 w-6" />
        </div>
      </Link>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sales today"   value={summary?.today_count || 0}                 icon={ShoppingBag} accent="gold" />
        <MetricCard label="Revenue today" value={formatGhs(summary?.today_total || 0)}      icon={DollarSign} accent="flame" />
        <MetricCard label="This week"     value={formatGhs(summary?.week_total || 0)}       icon={TrendingUp} accent="blue" />
        <MetricCard label="This month"    value={formatGhs(summary?.month_total || 0)}      icon={TrendingUp} accent="green" />
      </div>

      {/* Recent sales */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent sales</h2>
          <Link
            to="/employee/history"
            className="inline-flex items-center gap-1 text-sm font-semibold text-flame hover:text-flame-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-night-500">No sales yet.</p>
        ) : (
          <ul className="divide-y divide-night-100">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-night-500">{o.order_number}</p>
                  <p className="truncate text-sm font-semibold text-night-900">
                    {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''} · {o.payment_method}
                  </p>
                  <p className="truncate text-xs text-night-500">{formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="display text-base font-bold text-night-900 tabular-nums">
                    {formatGhs(o.total_kobo)}
                  </p>
                  <Link
                    to={`/employee/sale/${o.id}/receipt`}
                    className="inline-flex items-center gap-1 rounded-full bg-night-100 px-3 py-1.5 text-xs font-semibold text-night-700 cursor-pointer hover:bg-flame-50 hover:text-flame"
                  >
                    <Printer className="h-3 w-3" />
                    Receipt
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Secondary CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/employee/history">
          <Button variant="outline" fullWidth>View sales history</Button>
        </Link>
        {holds.count > 0 && (
          <Link to="/employee/sale">
            <Button variant="gold" fullWidth>Resume held cart ({holds.count})</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
