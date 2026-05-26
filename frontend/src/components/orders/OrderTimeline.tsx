import { Check, Clock, Truck, Package, ChefHat, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STEPS: { key: OrderStatus; label: string; icon: any }[] = [
  { key: 'PENDING',          label: 'Order placed',     icon: Clock },
  { key: 'CONFIRMED',        label: 'Confirmed',        icon: Check },
  { key: 'PREPARING',        label: 'Preparing',        icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered',        icon: Package },
]

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-700 ring-1 ring-red-100">
        <XCircle className="h-6 w-6" />
        <span className="font-semibold">This order was cancelled.</span>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="relative">
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-night-100 sm:left-1/2 sm:top-6 sm:bottom-6 sm:h-0.5 sm:w-auto sm:-translate-x-1/2" />
      <ol className="grid gap-6 sm:grid-cols-5 sm:gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const done = idx <= currentIdx
          const active = idx === currentIdx
          return (
            <li key={step.key} className="relative flex items-center gap-3 sm:flex-col sm:items-center">
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
                  done ? 'bg-flame text-white shadow-md shadow-flame/30' : 'bg-night-100 text-night-400',
                  active && 'ring-4 ring-flame/20 animate-pulse-soft',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn('text-sm font-medium sm:text-center', done ? 'text-night-900' : 'text-night-400')}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
