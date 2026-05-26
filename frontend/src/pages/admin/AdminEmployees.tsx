import { useEffect, useState } from 'react'
import { Plus, KeyRound, Power } from 'lucide-react'
import { api } from '@/lib/axios'
import type { User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { toast } from 'sonner'

export default function AdminEmployees() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  function load() {
    setLoading(true)
    api.get('/admin/employees').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function save() {
    try {
      const r = await api.post('/admin/employees', form)
      toast.success(`Employee ${r.data.employee.employee_id} created. Temp password: ${r.data.temp_password}`)
      setOpen(false); setForm({ name: '', phone: '', email: '' }); load()
    } catch { /* */ }
  }

  async function toggle(id: string, active: boolean) {
    await api.patch(`/admin/employees/${id}/status`, { is_active: !active })
    load()
  }
  async function resetPwd(id: string) {
    const r = await api.post(`/admin/employees/${id}/reset-password`)
    toast.success(`Temp password: ${r.data.temp_password}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Employees</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add employee</Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr><th className="px-4 py-3">ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-mono">{e.employee_id}</td>
                  <td>{e.name}</td>
                  <td>{e.phone}</td>
                  <td>{e.email || '—'}</td>
                  <td><span className={`badge ${e.is_active ? 'bg-green-100 text-green-700' : 'bg-night-100'}`}>{e.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td className="px-2">
                    <div className="flex gap-1">
                      <button onClick={() => resetPwd(e.id)} className="rounded p-1.5 hover:bg-night-100" title="Reset password"><KeyRound className="h-4 w-4" /></button>
                      <button onClick={() => toggle(e.id, e.is_active)} className="rounded p-1.5 hover:bg-night-100" title="Toggle"><Power className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New employee">
        <div className="space-y-3">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} hint="A temp password will be sent via SMS." />
          <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Button onClick={save} className="w-full">Create employee</Button>
        </div>
      </Modal>
    </div>
  )
}
