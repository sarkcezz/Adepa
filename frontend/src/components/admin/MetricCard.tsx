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
    <div className="card flex items-start gap-4">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${accentMap[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-night-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-night-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-night-500">{hint}</p>}
      </div>
    </div>
  )
}
