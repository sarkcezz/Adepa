import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: 'flame' | 'gold' | 'green' | 'blue'
}

const accentMap: Record<string, string> = {
  flame: 'bg-flame/10 text-flame',
  gold:  'bg-gold/15 text-gold-700',
  green: 'bg-green-100 text-green-700',
  blue:  'bg-blue-100 text-blue-700',
}

/**
 * KPI card for admin/employee dashboards.
 *
 * Layout: icon on top-left, label and value stacked next to it.
 * The label wraps to 2 lines (handles "Orders this month") and the
 * value is rendered in the display font with tabular nums so columns
 * of currency stay aligned. min-w-0 + word-break prevent the icon
 * from squeezing the text when the card is narrow.
 */
export function MetricCard({ label, value, icon: Icon, hint, accent = 'flame' }: Props) {
  return (
    <div className="card flex items-start gap-4">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${accentMap[accent]}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider text-night-500 leading-snug line-clamp-2"
          title={label}
        >
          {label}
        </p>
        <p
          className="display mt-1 break-words text-2xl font-bold leading-tight text-night-900 tabular-nums"
          title={String(value)}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-xs text-night-500" title={hint}>
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
