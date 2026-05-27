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
  gold:  'bg-gold/10 text-gold-600',
  green: 'bg-green-100 text-green-700',
  blue:  'bg-blue-100 text-blue-700',
}

export function MetricCard({ label, value, icon: Icon, hint, accent = 'flame' }: Props) {
  return (
    <div className="card flex items-start gap-3 overflow-hidden">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accentMap[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[11px] font-semibold uppercase tracking-wider text-night-500"
          title={label}
        >
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-xl font-bold text-night-900 sm:text-2xl"
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
