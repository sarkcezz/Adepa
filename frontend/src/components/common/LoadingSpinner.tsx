import { cn } from '@/lib/utils'

export function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 py-12 text-night-500', className)}
      role="status"
      aria-live="polite"
    >
      <svg className="h-6 w-6 animate-spin text-flame" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
      </svg>
      {label && <span className="text-sm">{label}</span>}
      {!label && <span className="sr-only">Loading…</span>}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl bg-white ring-1 ring-night-100"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="aspect-[4/3] shimmer" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 rounded shimmer" />
            <div className="h-3 w-1/3 rounded shimmer" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-7 w-20 rounded shimmer" />
              <div className="h-9 w-16 rounded-full shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
