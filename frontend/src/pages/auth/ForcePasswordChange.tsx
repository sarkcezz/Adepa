import { useNavigate } from 'react-router-dom'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard'
import { useAuth } from '@/hooks/useAuth'

/**
 * Full-screen interstitial shown when force_password_change=true.
 * Cannot be dismissed without setting a new password.
 *
 * Routed via the router guard — if a logged-in user has the flag set,
 * EVERY navigation lands here until they update.
 */
export default function ForcePasswordChange() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  function handleSuccess() {
    // Clear the flag in the auth store so the guard lets us through next render
    if (user) setUser({ ...user, force_password_change: false })

    // Land them on the right home for their role
    const home =
      user?.role === 'admin'    ? '/admin' :
      user?.role === 'employee' ? '/employee' : '/dashboard'

    navigate(home, { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream noise">
      <div className="container-tight grid min-h-screen place-items-center py-8">
        <div className="w-full max-w-md">
          <div className="card space-y-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-flame text-white shadow-flame">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Required step</p>
                <h1 className="display mt-1 text-2xl font-bold">Set a new password</h1>
                <p className="mt-1 text-sm text-night-600">
                  Hi {user?.name?.split(' ')[0]}, you're using a temporary password.
                  Set a permanent one to continue.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-night-50 px-4 py-3 text-xs text-night-600">
              <p className="font-semibold text-night-800 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Choose a strong password:
              </p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                <li>At least 8 characters</li>
                <li>Different from your temporary one</li>
                <li>Not a common word</li>
              </ul>
            </div>

            <ChangePasswordCard bare onSuccess={handleSuccess} />
          </div>

          <p className="mt-4 text-center text-xs text-night-500">
            Adepa Pork Hub · Account security
          </p>
        </div>
      </div>
    </div>
  )
}
