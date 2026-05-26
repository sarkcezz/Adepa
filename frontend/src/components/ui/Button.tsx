import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'gold' | 'ghost' | 'outline' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-flame text-white shadow-flame ' +
    'hover:bg-flame-600 hover:-translate-y-0.5 hover:shadow-flame-lg ' +
    'active:translate-y-0 active:scale-[0.98]',
  gold:
    'bg-gold text-night-900 shadow-gold ' +
    'hover:bg-gold-600 hover:-translate-y-0.5 ' +
    'active:translate-y-0 active:scale-[0.98]',
  dark:
    'bg-night-900 text-white shadow-medium ' +
    'hover:bg-night-700 hover:-translate-y-0.5 ' +
    'active:translate-y-0 active:scale-[0.98]',
  ghost:
    'bg-transparent text-night-800 hover:bg-night-100',
  outline:
    'border border-night-200 bg-white text-night-800 ' +
    'hover:border-flame hover:text-flame hover:bg-flame-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 ' +
    'active:scale-[0.98]',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, fullWidth, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight cursor-pointer select-none',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
        </svg>
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
