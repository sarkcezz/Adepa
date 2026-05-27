import { Banknote, Smartphone, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type Method = 'CASH' | 'MOMO' | 'CARD'

interface Props {
  value: Method
  onChange: (m: Method) => void
}

const options: { method: Method; label: string; icon: typeof Banknote }[] = [
  { method: 'CASH', label: 'Cash',       icon: Banknote },
  { method: 'MOMO', label: 'Mobile Money', icon: Smartphone },
  { method: 'CARD', label: 'Card',       icon: CreditCard },
]

/**
 * Three-button payment picker — replaces the dropdown so employees see
 * all options at a glance and tap once.
 */
export function PaymentPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
      {options.map(({ method, label, icon: Icon }) => {
        const active = value === method
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(method)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-3 cursor-pointer transition-all duration-200',
              active
                ? 'bg-flame text-white shadow-flame ring-2 ring-flame'
                : 'bg-white text-night-700 ring-1 ring-night-200 hover:bg-flame-50 hover:text-flame hover:ring-flame/30',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
