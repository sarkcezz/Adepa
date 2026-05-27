import { useState } from 'react'
import { KeyRound, Check, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

interface Props {
  /** Called after a successful password change. */
  onSuccess?: () => void
  /** Optional override for the heading. */
  title?: string
  /** Hide the card chrome — used inside the forced-change full-screen flow. */
  bare?: boolean
}

/**
 * Self-service password change. Sends:
 *   POST /auth/change-password { current_password, new_password, new_password_confirmation }
 *
 * Uses the existing AuthController::changePassword endpoint which also sets
 * force_password_change=false on success — so this doubles as the form
 * employees use on first login after a reset.
 */
export function ChangePasswordCard({ onSuccess, title = 'Change password', bare = false }: Props) {
  const [form, setForm]         = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShow] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (form.new_password.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (form.new_password !== form.new_password_confirmation) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', form)
      toast.success('Password updated.')
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      onSuccess?.()
    } catch {
      // Global axios interceptor surfaces 422 errors as a toast
    } finally {
      setLoading(false)
    }
  }

  const Wrapper = bare ? 'div' : 'div'

  return (
    <Wrapper className={bare ? 'space-y-4' : 'card space-y-4'}>
      {!bare && (
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-flame/10 text-flame">
            <KeyRound className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <Input
            label="Current password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            autoComplete="current-password"
          />
        </div>

        <div className="relative">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            autoComplete="new-password"
            hint="At least 8 characters"
          />
        </div>

        <Input
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          value={form.new_password_confirmation}
          onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
          autoComplete="new-password"
        />

        <label className="inline-flex items-center gap-2 text-xs text-night-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShow(e.target.checked)}
            className="h-3.5 w-3.5 accent-flame cursor-pointer"
          />
          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          Show passwords
        </label>

        <Button type="submit" loading={loading} fullWidth>
          <Check className="h-4 w-4" />
          Update password
        </Button>
      </form>
    </Wrapper>
  )
}
