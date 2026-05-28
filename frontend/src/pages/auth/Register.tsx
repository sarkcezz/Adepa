import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordStrengthMeter } from '@/components/profile/PasswordStrengthMeter'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
    } catch { /* toast in interceptor */ } finally { setLoading(false) }
  }

  return (
    <div className="container-tight grid min-h-[80vh] place-items-center py-10">
      <div className="w-full max-w-md card">
        <h1 className="display mb-1 text-3xl font-bold">Create your account</h1>
        <p className="mb-6 text-sm text-night-600">Join Adepa Pork Hub — order in seconds.</p>

        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Ghana phone" placeholder="0244 123 4567" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} hint="Format: 02XX/05X 7-digit number" />
          <div>
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
            <div className="mt-2">
              <PasswordStrengthMeter password={form.password} />
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-night-600">
          Already have an account? <Link to="/login" className="font-semibold text-flame hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
