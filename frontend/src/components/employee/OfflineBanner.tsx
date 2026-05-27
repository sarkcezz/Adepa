import { WifiOff, CloudUpload, RefreshCw } from 'lucide-react'

interface Props {
  online: boolean
  pendingCount: number
  onRetry: () => void
}

/**
 * Slim top banner shown when offline OR when there are unsynced sales.
 * Stays out of the way otherwise.
 */
export function OfflineBanner({ online, pendingCount, onRetry }: Props) {
  if (online && pendingCount === 0) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1
        ${online
          ? 'bg-amber-50 text-amber-900 ring-amber-200'
          : 'bg-night-900 text-white ring-night-700'
        }`}
    >
      <div className="flex items-center gap-2">
        {online ? (
          <CloudUpload className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4 animate-pulse-soft" />
        )}
        <span>
          {online
            ? `${pendingCount} sale${pendingCount !== 1 ? 's' : ''} queued — tap retry to sync.`
            : 'Offline — sales are saved locally and will sync when you reconnect.'}
        </span>
      </div>
      {online && pendingCount > 0 && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-flame px-3 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-flame-600"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  )
}
