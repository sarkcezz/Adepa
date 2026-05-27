import { useAuth } from '@/hooks/useAuth'
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard'
import { Shield, Mail, Phone, User as UserIcon } from 'lucide-react'

export default function AdminProfile() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Account</h1>
        <p className="mt-1 text-sm text-night-600">Your profile and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile info — read-only here; deeper edits done elsewhere */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold-700">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Signed in as</h2>
          </div>

          <dl className="space-y-3">
            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-night-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Name</dt>
                <dd className="truncate text-sm font-semibold text-night-900">{user.name}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-night-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Email</dt>
                <dd className="truncate text-sm font-mono text-night-700">{user.email || '—'}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-night-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Phone</dt>
                <dd className="truncate text-sm text-night-700">{user.phone}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-night-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Role</dt>
                <dd>
                  <span className="inline-flex items-center rounded-full bg-flame/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-flame">
                    {user.role}
                  </span>
                </dd>
              </div>
            </div>
          </dl>

          <div className="pt-2 border-t border-night-100">
            <button
              onClick={logout}
              className="text-sm font-semibold text-flame cursor-pointer hover:underline"
            >
              Sign out of all devices
            </button>
            <p className="mt-1 text-xs text-night-500">
              You'll be redirected to the sign-in screen.
            </p>
          </div>
        </div>

        {/* Change password */}
        <ChangePasswordCard />
      </div>

      {/* Security tips */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-sm font-semibold text-amber-900">Security tips</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
          <li>Use a unique password that you don't use anywhere else.</li>
          <li>Never share your admin password — anyone with it can change prices, void sales, and access customer data.</li>
          <li>If you suspect your account is compromised, change your password immediately and review the audit log.</li>
        </ul>
      </div>
    </div>
  )
}
