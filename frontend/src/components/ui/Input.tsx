import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-night-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-night-200 bg-white px-3 py-2.5 text-sm text-night-900 placeholder:text-night-400 focus:border-flame focus:ring-1 focus:ring-flame disabled:bg-night-50',
            error && 'border-flame ring-1 ring-flame',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-night-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-flame">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
