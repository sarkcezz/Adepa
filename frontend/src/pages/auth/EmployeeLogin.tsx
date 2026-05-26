import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function EmployeeLogin() {
  const { employeeLogin } = useAuth()
  const [form, setForm] = useState({ employee_id: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try { await employeeLogin(form.employee_id, form.password) }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="container-tight grid min-h-[80vh] place-items-center py-10">
      <div className="w-full max-w-md card">
        <div className="mb-4 inline-flex rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-700">Staff portal</div>
        <h1 className="display mb-1 text-3xl font-bold">Employee sign in</h1>
        <p className="mb-6 text-sm text-night-600">Use your Adepa Employee ID and password.</p>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Employee ID"
            placeholder="APH-0001"
            required
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value.toUpperCase() })}
          />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" loading={loading} variant="gold" className="w-full">Sign in to portal</Button>
        </form>
      </div>
    </div>
  )
}
