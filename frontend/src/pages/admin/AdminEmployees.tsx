import { useEffect, useState } from 'react'
import { Plus, KeyRound, Power, Pencil, Copy, Check } from 'lucide-react'
import { api } from '@/lib/axios'
import type { User, EmployeePosition } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { toast } from 'sonner'

const POSITION_LABELS: Record<EmployeePosition, string> = {
  cashier:    'Cashier',
  stand_lead: 'Stand Lead',
  supervisor: 'Supervisor',
  manager:    'Manager',
}

const POSITION_DESCRIPTIONS: Record<EmployeePosition, string> = {
  cashier:    'Record sales, view own history',
  stand_lead: 'Cashier + apply discounts, hold carts',
  supervisor: 'Stand Lead + void / refund sales',
  manager:    'Supervisor + see all employee performance',
}

interface FormState {
  name: string
  phone: string
  email: string
  position: EmployeePosition
}

const emptyForm: FormState = { name: '', phone: '', email: '', position: 'cashier' }

export default function AdminEmployees() {
  const [items, setItems]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState<FormState>(emptyForm)
  const [editingId, setEditing] = useState<string | null>(null)

  // Modal shown after resetting / creating with a temp password
  const [tempPasswordFor, setTempPasswordFor] = useState<{ name: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function load() {
    setLoading(true)
    api.get('/admin/employees').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function save() {
    try {
      if (editingId) {
        await api.put(`/admin/employees/${editingId}`, form)
        toast.success('Employee updated.')
      } else {
        const r = await api.post('/admin/employees', form)
        setTempPasswordFor({ name: r.data.employee.name, password: r.data.temp_password })
      }
      setOpen(false); setForm(emptyForm); setEditing(null); load()
    } catch { /* */ }
  }

  function startEdit(emp: User) {
    setForm({
      name:     emp.name,
      phone:    emp.phone,
      email:    emp.email || '',
      position: (emp.position as EmployeePosition) || 'cashier',
    })
    setEditing(emp.id)
    setOpen(true)
  }

  async function toggle(id: string, active: boolean) {
    await api.patch(`/admin/employees/${id}/status`, { is_active: !active })
    load()
  }

  async function resetPwd(emp: User) {
    if (!confirm(`Reset ${emp.name}'s password? Their current sessions will be revoked.`)) return
    try {
      const r = await api.post(`/admin/employees/${emp.id}/reset-password`)
      setTempPasswordFor({ name: emp.name, password: r.data.temp_password })
    } catch { /* */ }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Employees</h1>
        <Button onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true) }}>
          <Plus className="h-4 w-4" /> Add employee
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-mono text-xs">{e.employee_id}</td>
                  <td className="font-medium">
                    {e.name}
                    {e.email && <div className="text-xs text-night-500">{e.email}</div>}
                  </td>
                  <td className="text-night-600">{e.phone}</td>
                  <td>
                    <span className="inline-flex items-center rounded-full bg-night-100 px-2.5 py-0.5 text-xs font-medium text-night-700">
                      {POSITION_LABELS[(e.position as EmployeePosition) || 'cashier']}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${e.is_active ? 'bg-green-100 text-green-700' : 'bg-night-100 text-night-500'}`}>
                      {e.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-2">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(e)} className="rounded p-1.5 cursor-pointer hover:bg-night-100" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => resetPwd(e)} className="rounded p-1.5 cursor-pointer hover:bg-night-100" title="Reset password">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggle(e.id, e.is_active)} className="rounded p-1.5 cursor-pointer hover:bg-night-100" title="Toggle active">
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-night-500">No employees yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit employee' : 'New employee'}>
        <div className="space-y-3">
          <Input label="Full name" value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" value={form.phone}
                 onChange={(e) => setForm({ ...form, phone: e.target.value })}
                 hint={editingId ? undefined : 'A temp password will be sent via SMS.'} />
          <Input label="Email (optional)" type="email" value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <Select label="Position" value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value as EmployeePosition })}>
            {(Object.keys(POSITION_LABELS) as EmployeePosition[]).map((p) => (
              <option key={p} value={p}>{POSITION_LABELS[p]}</option>
            ))}
          </Select>
          <p className="text-xs text-night-500">{POSITION_DESCRIPTIONS[form.position]}</p>

          <Button onClick={save} fullWidth>
            {editingId ? 'Save changes' : 'Create employee'}
          </Button>
        </div>
      </Modal>

      {/* Temp password reveal modal */}
      <Modal
        open={!!tempPasswordFor}
        onClose={() => setTempPasswordFor(null)}
        title="Temporary password"
        size="sm"
      >
        {tempPasswordFor && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
              <p className="font-semibold text-amber-900">Show this only once.</p>
              <p className="mt-1 text-amber-800">
                {tempPasswordFor.name} must use this to log in, then change it. We've also sent it via SMS.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-flame/30 bg-flame-50 px-4 py-4">
              <code className="display flex-1 truncate text-xl font-bold text-flame" title={tempPasswordFor.password}>
                {tempPasswordFor.password}
              </code>
              <button
                onClick={() => copy(tempPasswordFor.password)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-flame ring-1 ring-flame/20 cursor-pointer hover:bg-flame hover:text-white"
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>

            <Button fullWidth onClick={() => setTempPasswordFor(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
