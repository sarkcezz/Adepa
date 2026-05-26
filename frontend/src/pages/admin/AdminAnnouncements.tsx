import { useEffect, useState } from 'react'
import { Plus, Power, Trash2 } from 'lucide-react'
import { api } from '@/lib/axios'
import type { StandAnnouncement, StandLocation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'

const empty = {
  title: '', description: '',
  locations: [{ name: '', area: '', days: '', hours: '', map_link: '' }] as StandLocation[],
  start_date: '', end_date: '', is_published: true,
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState<StandAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(empty)

  function load() {
    setLoading(true)
    api.get('/admin/announcements').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function save() {
    try {
      await api.post('/admin/announcements', form)
      toast.success('Announcement created.')
      setOpen(false); setForm(empty); load()
    } catch { /* */ }
  }

  async function toggle(id: string) {
    await api.patch(`/admin/announcements/${id}/toggle`)
    load()
  }
  async function del(id: string) {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/admin/announcements/${id}`)
    load()
  }

  function addLoc() {
    setForm({ ...form, locations: [...form.locations, { name: '', area: '', days: '', hours: '', map_link: '' }] })
  }
  function setLoc(i: number, k: keyof StandLocation, v: string) {
    const locs = [...form.locations]
    locs[i] = { ...locs[i], [k]: v }
    setForm({ ...form, locations: locs })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Stand Announcements</h1>
        <Button onClick={() => { setForm(empty); setOpen(true) }}><Plus className="h-4 w-4" /> New announcement</Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid gap-4">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="display text-xl font-bold">{a.title}</h3>
                  <p className="text-sm text-night-500">{formatDate(a.start_date)} – {formatDate(a.end_date)} • {a.locations.length} stand{a.locations.length !== 1 && 's'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-night-100'}`}>{a.is_published ? 'Published' : 'Draft'}</span>
                  <button onClick={() => toggle(a.id)} className="rounded p-2 hover:bg-night-100"><Power className="h-4 w-4" /></button>
                  <button onClick={() => del(a.id)} className="rounded p-2 hover:bg-night-100"><Trash2 className="h-4 w-4 text-flame" /></button>
                </div>
              </div>
              <p className="mt-2 text-sm text-night-600">{a.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.locations.map((l, i) => <span key={i} className="badge bg-cream">{l.name}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New announcement" size="lg">
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Stand locations</label>
              <button onClick={addLoc} className="text-xs font-semibold text-flame hover:underline">+ Add</button>
            </div>
            <div className="space-y-3">
              {form.locations.map((loc: StandLocation, i: number) => (
                <div key={i} className="grid gap-2 rounded-lg bg-cream p-3 sm:grid-cols-2">
                  <Input placeholder="Name" value={loc.name} onChange={(e) => setLoc(i, 'name', e.target.value)} />
                  <Input placeholder="Area" value={loc.area} onChange={(e) => setLoc(i, 'area', e.target.value)} />
                  <Input placeholder="Days (Mon–Sat)" value={loc.days} onChange={(e) => setLoc(i, 'days', e.target.value)} />
                  <Input placeholder="Hours (07:00–18:00)" value={loc.hours} onChange={(e) => setLoc(i, 'hours', e.target.value)} />
                  <Input className="sm:col-span-2" placeholder="Google Maps link (optional)" value={loc.map_link || ''} onChange={(e) => setLoc(i, 'map_link', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-flame" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Publish immediately
          </label>

          <Button onClick={save} className="w-full">Create announcement</Button>
        </div>
      </Modal>
    </div>
  )
}
