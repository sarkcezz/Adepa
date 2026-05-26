import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { api } from '@/lib/axios'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/formatters'

interface Registration {
  id: string
  payment_status: 'PENDING' | 'PAID' | 'FAILED'
  checked_in: boolean
  event: {
    id: string
    name: string
    event_date: string
    event_time: string
    venue_name: string
  }
}

export default function MyEvents() {
  const [list, setList] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/events/my-registrations').then((r) => setList(r.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">My Events</h1>

      {loading ? <LoadingSpinner /> : list.length === 0 ? (
        <EmptyState
          title="No event registrations"
          description="Discover upcoming Pork Events and reserve a seat."
          icon={<Calendar className="h-8 w-8" />}
          action={<Link to="/events" className="btn btn-primary">Browse events</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((reg) => (
            <div key={reg.id} className="card">
              <h3 className="display text-lg font-bold">{reg.event.name}</h3>
              <ul className="mt-2 space-y-1 text-sm text-night-600">
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" />{formatDate(reg.event.event_date)} • {reg.event.event_time.slice(0, 5)}</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{reg.event.venue_name}</li>
              </ul>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={reg.payment_status === 'PAID' ? 'success' : reg.payment_status === 'PENDING' ? 'warning' : 'danger'}>
                  {reg.payment_status}
                </Badge>
                {reg.checked_in && <Badge variant="info">Checked in</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
