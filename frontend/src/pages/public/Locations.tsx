import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { api } from '@/lib/axios'
import type { StandAnnouncement } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/formatters'

export default function Locations() {
  const [items, setItems] = useState<StandAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/announcements/active').then((r) => setItems(r.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-tight py-10">
      <div className="mb-8">
        <h1 className="display text-3xl font-bold sm:text-4xl">Stand Locations</h1>
        <p className="mt-1 text-night-600">Find us at a stand near you this week.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No active stands right now" description="Check back soon — new locations are announced weekly." />
      ) : (
        items.map((announcement) => (
          <section key={announcement.id} className="mb-10">
            <div className="mb-5 rounded-2xl bg-gold/10 p-5">
              <p className="text-sm font-semibold text-gold-700 uppercase tracking-wide">Active stands</p>
              <h2 className="display mt-1 text-2xl font-bold">{announcement.title}</h2>
              <p className="mt-1 text-sm text-night-700">{announcement.description}</p>
              <p className="mt-2 text-xs text-night-500">
                {formatDate(announcement.start_date)} – {formatDate(announcement.end_date)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {announcement.locations.map((loc, i) => (
                <div key={i} className="card flex flex-col">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-flame/10 text-flame">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-night-900">{loc.name}</h3>
                  <p className="text-sm text-night-600">{loc.area}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-night-600">
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {loc.days}</p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" /> {loc.hours}</p>
                  </div>
                  {loc.map_link && (
                    <a href={loc.map_link} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-flame hover:underline">
                      Open in Maps →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
