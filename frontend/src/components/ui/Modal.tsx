import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClass: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-900/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div className={cn('relative w-full max-h-[95vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl animate-slide-up', sizeClass[size])}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-night-100 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-night-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-night-500 hover:bg-night-100 hover:text-night-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
