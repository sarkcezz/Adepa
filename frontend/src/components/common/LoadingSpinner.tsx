import { cn } from '@/lib/utils'

export function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-12 text-night-500', className)}>
      <svg className="h-6 w-6 animate-spin text-flame" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
      </svg>
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-white p-5 ring-1 ring-night-100">
          <div className="mb-3 h-40 rounded-lg bg-night-100" />
          <div className="mb-2 h-4 w-2/3 rounded bg-night-100" />
          <div className="h-3 w-1/3 rounded bg-night-100" />
        </div>
      ))}
    </div>
  )
}
