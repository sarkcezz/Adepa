import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-night-100">
      <div className="mb-4 rounded-full bg-cream p-4 text-gold">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-night-900">{title}</h3>
      {description && <p className="mb-5 max-w-sm text-sm text-night-500">{description}</p>}
      {action}
    </div>
  )
}
