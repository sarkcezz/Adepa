import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useOrderTracking } from '@/hooks/useOrderTracking'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDateTime, formatStatus } from '@/lib/formatters'

export default function OrderTracking() {
  const { id } = useParams()
  const { status, history, loading, error } = useOrderTracking(id, 10000)

  if (loading) return <LoadingSpinner label="Loading live status…" />

  return (
    <div className="space-y-6">
      <Link to={`/dashboard/orders/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
        <ArrowLeft className="h-4 w-4" /> Back to order
      </Link>

      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="display text-2xl font-bold">Live tracking</h1>
            <p className="text-sm text-night-500">Auto-refreshing every 10 seconds.</p>
          </div>
          {status && <OrderStatusBadge status={status} />}
        </div>

        {status && <OrderTimeline status={status} />}
        {error && <p className="mt-4 text-sm text-flame">{error}</p>}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Activity</h2>
        <ol className="relative space-y-3 border-l-2 border-night-100 pl-5">
          {history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[26px] top-1 grid h-3 w-3 place-items-center rounded-full bg-flame" />
              <p className="text-sm font-semibold">{formatStatus(h.status)}</p>
              {h.note && <p className="text-xs text-night-500">{h.note}</p>}
              <p className="text-xs text-night-400">{formatDateTime(h.created_at)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
