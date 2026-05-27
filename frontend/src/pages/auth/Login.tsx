import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Login() {
  const [params] = useSearchParams()
  const next = params.get('next')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      if (next) navigate(next)
    } catch (err: any) {
      // toast handled in axios interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-tight grid min-h-[80vh] place-items-center py-10">
      <div className="w-full max-w-md card">
        <h1 className="display mb-1 text-3xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-night-600">Sign in to your Adepa Pork Hub account.</p>

        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-flame hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>

        <p className="mt-6 text-center text-sm text-night-600">
          New here? <Link to="/register" className="font-semibold text-flame hover:underline">Create an account</Link>
        </p>

        <div className="mt-4 rounded-xl bg-night-50 px-3 py-2.5 text-center text-xs text-night-600">
          Adepa team member?{' '}
          <Link to="/employee/login" className="font-semibold text-flame hover:underline">
            Use the staff portal →
          </Link>
        </div>
      </div>
    </div>
  )
}
