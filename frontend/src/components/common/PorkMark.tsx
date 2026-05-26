/**
 * Editorial SVG marks used as image fallbacks and decorative placeholders.
 * Replaces emoji usage across the app per design-system rules (no emoji icons).
 */
import { cn } from '@/lib/utils'

interface MarkProps {
  className?: string
  variant?: 'raw' | 'spiced' | 'ready' | 'event'
}

/** Stylised pork-belly cut + sprig, rendered in brand palette. */
export function PorkMark({ className, variant = 'raw' }: MarkProps) {
  // Background gradient ID is variant-scoped so multiple instances coexist.
  const gradId = `pm-grad-${variant}`

  const palette = {
    raw:    { from: '#FAF6EE', to: '#F9D0CA', accent: '#C0281A' },
    spiced: { from: '#FAF6EE', to: '#F0C56B', accent: '#C0281A' },
    ready:  { from: '#262626', to: '#1A1A1A', accent: '#D4920A' },
    event:  { from: '#7F1B11', to: '#C0281A', accent: '#D4920A' },
  }[variant]

  return (
    <svg
      viewBox="0 0 200 150"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <linearGradient id={`${gradId}-meat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#E5867A" />
          <stop offset="50%" stopColor="#C0281A" />
          <stop offset="100%" stopColor="#7F1B11" />
        </linearGradient>
      </defs>

      <rect width="200" height="150" fill={`url(#${gradId})`} />

      {/* Stylised pork cut — abstract editorial illustration */}
      <g transform="translate(40 30)">
        {/* meat layers (alternating fat + lean stripes — pork belly) */}
        <path
          d="M0 30 Q60 -5 120 30 L120 80 Q60 105 0 80 Z"
          fill={`url(#${gradId}-meat)`}
          opacity="0.95"
        />
        {/* fat striations */}
        <path d="M5 45 Q60 25 115 45"  stroke="#FAF6EE" strokeWidth="2.5" fill="none" opacity="0.6" />
        <path d="M5 62 Q60 45 115 62"  stroke="#FAF6EE" strokeWidth="2.5" fill="none" opacity="0.6" />
        <path d="M5 78 Q60 65 115 78"  stroke="#FAF6EE" strokeWidth="2"   fill="none" opacity="0.4" />
        {/* highlight */}
        <path d="M10 35 Q60 18 110 35" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.35" />
      </g>

      {/* Sprig accent (top-right) */}
      <g transform="translate(150 18)" opacity="0.85">
        <path d="M0 0 Q8 8 14 18 Q20 28 22 40" stroke={palette.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="6"  cy="6"  rx="3.5" ry="2" fill={palette.accent} transform="rotate(-30 6 6)" />
        <ellipse cx="14" cy="18" rx="3.5" ry="2" fill={palette.accent} transform="rotate(-10 14 18)" />
        <ellipse cx="20" cy="30" rx="3.5" ry="2" fill={palette.accent} transform="rotate(15 20 30)" />
      </g>
    </svg>
  )
}

/** Decorative wordmark "A" used in headers — sharper than emoji/text. */
export function AdepaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      aria-label="Adepa Pork Hub"
      role="img"
    >
      <defs>
        <linearGradient id="adepa-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#C0281A" />
          <stop offset="100%" stopColor="#7F1B11" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#adepa-mark-grad)" />
      {/* Stylised "A" */}
      <path
        d="M11 30 L20 10 L29 30 M14.5 23 L25.5 23"
        stroke="#FAF6EE"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Flame dot */}
      <circle cx="20" cy="6" r="1.8" fill="#D4920A" />
    </svg>
  )
}
