import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, RefreshCw } from 'lucide-react'
import { useOrderTracking } from '@/hooks/useOrderTracking'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDateTime, formatStatus } from '@/lib/formatters'
import type { OrderStatus } from '@/types'

// Per-status hero copy. The tracking page is the post-purchase peak — it
// should feel warm and reassuring, not like a database row.
const HERO: Record<OrderStatus, { headline: string; sub: string; eta: string | null; tone: string }> = {
  PENDING:          { headline: "We've got your order",        sub: "Sit tight — we're confirming it now.",                 eta: 'Confirmation in a few minutes', tone: 'from-night-800 to-night-900' },
  CONFIRMED:        { headline: 'Order confirmed',             sub: "Our kitchen has your order and is getting ready.",     eta: 'Prep starts shortly',           tone: 'from-flame-700 to-flame' },
  PREPARING:        { headline: 'Your pork is on the fire',    sub: 'Freshly prepared, the way it should be.',              eta: 'Ready in 20–30 min',            tone: 'from-flame to-flame-700' },
  OUT_FOR_DELIVERY: { headline: 'On its way to you',           sub: 'Your rider is heading over now.',                      eta: 'Arriving soon',                 tone: 'from-gold-700 to-flame' },
  DELIVERED:        { headline: 'Delivered — enjoy!',          sub: 'Thanks for choosing Adepa. We hope it hits the spot.', eta: null,                            tone: 'from-green-700 to-green-800' },
  CANCELLED:        { headline: 'Order cancelled',             sub: 'This order was cancelled. Reach out if this is unexpected.', eta: null,                       tone: 'from-night-700 to-night-900' },
}

export default function OrderTracking() {
  const { id } = useParams()
  const { status, history, loading, error } = useOrderTracking(id, 10000)

  if (loading) return <LoadingSpinner label="Loading live status…" />

  const hero = status ? HERO[status] : null
  const isLive = status && !['DELIVERED', 'CANCELLED'].includes(status)

  return (
    <div className="space-y-6">
      <Link to={`/dashboard/orders/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
        <ArrowLeft className="h-4 w-4" /> Back to order
      </Link>

      {/* Hero status */}
      {hero && (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${hero.tone} p-7 text-white noise`}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" /> Live
              </span>
            )}
            <h1 className="display mt-3 text-3xl font-bold">{hero.headline}</h1>
            <p className="mt-1.5 max-w-md text-white/85">{hero.sub}</p>
            {hero.eta && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium">
                <Flame className="h-4 w-4 text-gold" /> {hero.eta}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
        {status && <OrderTimeline status={status} />}
        {isLive && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-night-500">
            <RefreshCw className="h-3 w-3" /> Updating automatically every 10 seconds
          </p>
        )}
        {error && <p className="mt-4 text-center text-sm text-flame">{error}</p>}
      </div>

      {/* Activity log */}
      {history.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-night-100">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-night-500">Activity</h2>
          <ol className="space-y-4">
            {history.map((h, idx) => (
              <li key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-flame ring-4 ring-flame/15' : 'bg-night-300'}`} />
                  {idx < history.length - 1 && <span className="mt-1 w-px flex-1 bg-night-100" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-semibold text-night-900">{formatStatus(h.status)}</p>
                  {h.note && <p className="text-xs text-night-600">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-night-400">{formatDateTime(h.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
