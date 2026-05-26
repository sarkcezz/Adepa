import { useEffect, useState } from 'react'
import { Plus, XCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import type { PorkEvent } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDate, formatGhs } from '@/lib/formatters'
import { toast } from 'sonner'

const empty = {
  name: '', event_date: '', event_time: '18:00',
  venue_name: '', venue_address: '', flat_rate_kobo: 8000,
  capacity: 50, description: '', image_url: '', status: 'PUBLISHED',
}

export default function AdminEvents() {
  const [events, setEvents] = useState<PorkEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(empty)

  function load() {
    setLoading(true)
    api.get('/admin/events').then((r) => setEvents(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function save() {
    try {
      await api.post('/admin/events', form)
      toast.success('Event created.')
      setOpen(false); setForm(empty); load()
    } catch { /* */ }
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this event? All registered attendees will be notified.')) return
    await api.post(`/admin/events/${id}/cancel`)
    toast.success('Event cancelled.')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl font-bold">Pork Events</h1>
        <Button onClick={() => { setForm(empty); setOpen(true) }}><Plus className="h-4 w-4" /> New event</Button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="display text-xl font-bold">{e.name}</h3>
                  <p className="text-sm text-night-500">{formatDate(e.event_date)} • {e.event_time?.slice(0, 5)} • {e.venue_name}</p>
                </div>
                <span className={`badge ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : e.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-night-100'}`}>{e.status}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-night-600">{e.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>{e.registered_count}/{e.capacity} registered • <strong>{formatGhs(e.flat_rate_kobo)}</strong></span>
                {e.status !== 'CANCELLED' && (
                  <button onClick={() => cancel(e.id)} className="text-flame hover:underline">
                    <XCircle className="inline h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New event" size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Date" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          <Input label="Time" type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
          <Input label="Venue name" value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
          <Input label="Venue address" value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} />
          <Input label="Flat rate (kobo)" type="number" hint="GHS 80 = 8000" value={form.flat_rate_kobo} onChange={(e) => setForm({ ...form, flat_rate_kobo: Number(e.target.value) })} />
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          <Select className="sm:col-span-2" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <Button onClick={save} className="mt-5 w-full">Create event</Button>
      </Modal>
    </div>
  )
}
