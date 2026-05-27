import { Pause, Trash2 } from 'lucide-react'
import type { HeldCart } from '@/hooks/useHeldCarts'

interface Props {
  open: boolean
  onClose: () => void
  carts: HeldCart[]
  onResume: (id: string) => void
  onDiscard: (id: string) => void
}

/**
 * Slide-in drawer listing held carts so an employee can resume a paused
 * customer order. Empty state explains how holds work.
 */
export function HoldCartsDrawer({ open, onClose, carts, onResume, onDiscard }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-night-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-96 max-w-[92vw] overflow-y-auto bg-cream p-6 shadow-2xl animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 text-gold-700">
              <Pause className="h-4 w-4" />
            </div>
            <h2 className="display text-lg font-bold">Held carts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-night-600 cursor-pointer hover:bg-night-100"
          >
            Close
          </button>
        </div>

        {carts.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center ring-1 ring-night-100">
            <Pause className="mx-auto mb-2 h-6 w-6 text-night-300" />
            <p className="text-sm font-semibold text-night-800">No held carts</p>
            <p className="mt-1 text-xs text-night-500">
              Tap "Hold" while ringing up a sale to pause and serve another customer.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {carts.map((c) => (
              <li key={c.id} className="rounded-xl bg-white p-3 ring-1 ring-night-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-night-900" title={c.name}>
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-xs text-night-500">
                      {c.items.length} item{c.items.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(c.held_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      {c.payment_method}
                    </p>
                  </div>
                  <button
                    onClick={() => onDiscard(c.id)}
                    className="rounded-full p-1.5 text-night-400 cursor-pointer hover:bg-flame-50 hover:text-flame"
                    aria-label="Discard held cart"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => onResume(c.id)}
                  className="mt-2 w-full rounded-full bg-flame px-4 py-2 text-xs font-semibold text-white cursor-pointer transition-colors hover:bg-flame-600"
                >
                  Resume cart
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
