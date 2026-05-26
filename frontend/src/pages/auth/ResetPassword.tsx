import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: params.get('email') || '',
    token: params.get('token') || '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!form.token || !form.email) {
      toast.error('Invalid or expired reset link.')
    }
  }, [form.token, form.email])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', form)
      setDone(true)
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 2500)
    } catch { /* handled */ } finally { setLoading(false) }
  }

  return (
    <div className="container-tight grid min-h-[80vh] place-items-center py-10">
      <div className="w-full max-w-md card">
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="display mb-1 text-2xl font-bold">Password reset</h1>
            <p className="text-sm text-night-600">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-flame/10 text-flame">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="display mb-1 text-3xl font-bold">Choose a new password</h1>
            <p className="mb-6 text-sm text-night-600">Set a strong password — at least 8 characters.</p>

            <form onSubmit={submit} className="space-y-4">
              <Input label="Email" type="email" value={form.email} disabled />
              <Input
                label="New password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                hint="Minimum 8 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                required
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              />
              <Button type="submit" loading={loading} className="w-full" disabled={!form.token}>
                Reset password
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-night-600">
              <Link to="/login" className="font-semibold text-flame hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
