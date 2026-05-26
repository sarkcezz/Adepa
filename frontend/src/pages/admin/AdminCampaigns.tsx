import { useEffect, useState } from 'react'
import { Plus, Power } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Campaign } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'

const empty = {
  name: '', code: '', discount_type: 'PERCENT', discount_value: 10,
  min_order_kobo: 0, max_usage: null as number | null,
  valid_from: '', valid_to: '', is_active: true,
}

export default function AdminCampaigns() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(empty)

  function load() {
    setLoading(true)
    api.get('/admin/campaigns').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function save() {
    try {
      await api.post('/admin/campaigns', form)
      toast.success('Campaign created.')
      setOpen(false); setForm(empty); load()
    } catch { /* */ }
  }

  async function toggle(id: string) {
    await api.patch(`/admin/campaigns/${id}/toggle`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Campaigns</h1>
        <Button onClick={() => { setForm(empty); setOpen(true) }}><Plus className="h-4 w-4" /> New campaign</Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Used</th>
                <th>Valid until</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-mono font-bold text-flame">{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.discount_type}</td>
                  <td>{c.discount_type === 'PERCENT' ? `${c.discount_value}%` : c.discount_type === 'FIXED' ? `GHS ${(c.discount_value / 100).toFixed(2)}` : 'Free delivery'}</td>
                  <td>{c.usage_count}{c.max_usage ? ` / ${c.max_usage}` : ''}</td>
                  <td className="text-night-500">{formatDate(c.valid_to)}</td>
                  <td>{c.is_active ? <span className="badge bg-green-100 text-green-700">On</span> : <span className="badge bg-night-100">Off</span>}</td>
                  <td className="px-2"><button onClick={() => toggle(c.id)} className="rounded p-1.5 hover:bg-night-100"><Power className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New campaign" size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Select label="Type" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed (kobo)</option>
            <option value="FREE_DELIVERY">Free delivery</option>
          </Select>
          <Input label="Value" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
          <Input label="Min order (kobo)" type="number" value={form.min_order_kobo} onChange={(e) => setForm({ ...form, min_order_kobo: Number(e.target.value) })} />
          <Input label="Max usage (blank = unlimited)" type="number" value={form.max_usage || ''} onChange={(e) => setForm({ ...form, max_usage: e.target.value ? Number(e.target.value) : null })} />
          <Input label="Valid from" type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
          <Input label="Valid to" type="datetime-local" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
        </div>
        <Button onClick={save} className="mt-5 w-full">Create campaign</Button>
      </Modal>
    </div>
  )
}
