import { useMemo } from 'react'
import { Check, X } from 'lucide-react'

interface Props {
  password: string
  /** Optional minimum score (0-4) for the meter to label the password "OK". */
  minScore?: number
}

/**
 * Lightweight password strength meter. No external library — keeps the
 * bundle small. Scores on five checks:
 *
 *   1. ≥ 8 characters
 *   2. lowercase letter present
 *   3. uppercase letter present
 *   4. digit present
 *   5. symbol present (anything not alphanumeric)
 *
 * Plus a hard reject for obviously-common passwords. Score 0-5 maps to:
 *   0-1 → Too weak (red)
 *   2-3 → Okay     (amber)
 *   4   → Good     (gold)
 *   5   → Strong   (green)
 *
 * Server-side validation still enforces min 8 chars regardless — this
 * is UX guidance, not the source of truth.
 */

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', 'qwerty', 'admin',
  'letmein', 'welcome', 'monkey', 'dragon', 'master', 'abc123',
  'adepa', 'pork', 'changeme', 'changeme2025',
])

function score(p: string): { score: number; checks: { label: string; passed: boolean }[]; warning?: string } {
  if (!p) return { score: 0, checks: [] }

  const checks = [
    { label: 'At least 8 characters', passed: p.length >= 8 },
    { label: 'Lowercase letter',      passed: /[a-z]/.test(p) },
    { label: 'Uppercase letter',      passed: /[A-Z]/.test(p) },
    { label: 'Number',                passed: /\d/.test(p) },
    { label: 'Symbol (!@#$…)',        passed: /[^a-zA-Z0-9]/.test(p) },
  ]

  let s = checks.filter((c) => c.passed).length

  // Common-password penalty trumps everything
  let warning: string | undefined
  if (COMMON.has(p.toLowerCase())) {
    s = 0
    warning = 'This is one of the most common passwords — please choose something else.'
  } else if (p.length >= 12) {
    // Bonus point for length, capped at 5
    s = Math.min(5, s + 1)
  }

  return { score: s, checks, warning }
}

const LEVELS = [
  { label: 'Too weak', color: 'bg-red-500',    text: 'text-red-700'    },
  { label: 'Too weak', color: 'bg-red-500',    text: 'text-red-700'    },
  { label: 'Okay',     color: 'bg-amber-500',  text: 'text-amber-700'  },
  { label: 'Okay',     color: 'bg-amber-500',  text: 'text-amber-700'  },
  { label: 'Good',     color: 'bg-gold',       text: 'text-gold-700'   },
  { label: 'Strong',   color: 'bg-green-500',  text: 'text-green-700'  },
]

export function PasswordStrengthMeter({ password, minScore = 3 }: Props) {
  const { score: s, checks, warning } = useMemo(() => score(password), [password])

  if (!password) return null

  const level = LEVELS[s] || LEVELS[0]
  const meetsMin = s >= minScore

  return (
    <div className="space-y-2 text-xs">
      {/* Bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= s ? level.color : 'bg-night-100'}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Label */}
      <p className={`font-semibold ${level.text}`}>
        Password strength: {level.label}
        {meetsMin && s >= 4 && <span className="ml-1 text-night-400 font-normal">— nice</span>}
      </p>

      {/* Common-password warning */}
      {warning && (
        <p className="rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-800 ring-1 ring-red-200">
          ⚠ {warning}
        </p>
      )}

      {/* Per-rule checklist (only show until met) */}
      {!meetsMin && (
        <ul className="space-y-0.5 text-night-600">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5">
              {c.passed
                ? <Check className="h-3 w-3 text-green-600" />
                : <X className="h-3 w-3 text-night-400" />}
              <span className={c.passed ? 'text-night-500 line-through' : ''}>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
