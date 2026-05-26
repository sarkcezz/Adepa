import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Check your email for a reset link.')
    } catch { /* */ } finally { setLoading(false) }
  }

  return (
    <div className="container-tight grid min-h-[80vh] place-items-center py-10">
      <div className="w-full max-w-md card">
        <h1 className="display mb-1 text-3xl font-bold">Reset password</h1>
        <p className="mb-6 text-sm text-night-600">Enter your email — we'll send a reset link.</p>

        {sent ? (
          <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">If an account exists for {email}, a reset email is on the way.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-night-600">
          <Link to="/login" className="font-semibold text-flame hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
