import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react'
import { api } from '@/lib/axios'
import type { PorkEvent } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatGhs } from '@/lib/formatters'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { openPaystack } from '@/lib/paystack'
import { toast } from 'sonner'

export default function Events() {
  const [events,  setEvents]  = useState<PorkEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/events/upcoming').then((r) => setEvents(r.data.data)).finally(() => setLoading(false))
  }, [])

  async function handleRegister(eventId: string, amountKobo: number) {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/events/${eventId}/register`)
      const { reference } = res.data.paystack
      openPaystack({
        email: user.email || `${user.phone}@adepaporkhub.shop`,
        amountKobo,
        reference,
        metadata: { event_id: eventId },
        onSuccess: () => toast.success('Registration successful! See you at the event.'),
        onClose: () => toast.info('Payment cancelled.'),
      })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not register.')
    }
  }

  return (
    <div className="container-tight py-10">
      <div className="mb-8">
        <h1 className="display text-3xl font-bold sm:text-4xl">Pork Events</h1>
        <p className="mt-1 text-night-600">Monthly eat-and-drink gatherings — flat rate, all included.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState
          title="No upcoming events"
          description="Check back soon — our next pork night will be announced."
          icon={<Sparkles className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {events.map((e) => {
            const slotsLeft = e.capacity - e.registered_count
            const percent = (e.registered_count / e.capacity) * 100
            return (
              <div key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-100">
                <div className="relative h-44 bg-gradient-to-br from-flame to-gold">
                  {e.image_url && <img src={e.image_url} alt={e.name} className="h-full w-full object-cover" />}
                  <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-flame">
                    {slotsLeft > 0 ? `${slotsLeft} slots left` : 'Sold out'}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="display mb-2 text-2xl font-bold">{e.name}</h3>
                  <p className="mb-4 line-clamp-3 text-sm text-night-600">{e.description}</p>
                  <ul className="mb-5 space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {formatDate(e.event_date)} • {e.event_time.slice(0, 5)}</li>
                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {e.venue_name}</li>
                    <li className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Capacity {e.capacity}</li>
                  </ul>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-night-100">
                    <div className="h-full bg-flame" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-flame">{formatGhs(e.flat_rate_kobo)}</span>
                    <Button
                      disabled={slotsLeft <= 0}
                      onClick={() => handleRegister(e.id, e.flat_rate_kobo)}
                    >
                      Reserve a seat
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
