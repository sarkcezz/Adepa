import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, ArrowUpRight } from 'lucide-react'
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
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">This week</p>
        <h1 className="display-2 mt-2">Where to find us</h1>
        <p className="mt-2 text-night-600">Fresh from the stand — visit any of our locations near you.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No active stands right now" description="Check back soon — new locations are announced weekly." />
      ) : (
        items.map((announcement) => (
          <section key={announcement.id} className="mb-12">
            {/* Announcement header — full-bleed band, not a card */}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-gold/40 pb-3">
              <h2 className="display text-2xl font-bold">{announcement.title}</h2>
              <span className="text-sm font-medium text-night-500">
                {formatDate(announcement.start_date)} – {formatDate(announcement.end_date)}
              </span>
            </div>
            {announcement.description && (
              <p className="mt-3 max-w-2xl text-night-600">{announcement.description}</p>
            )}

            {/* Stands as an editorial list — numbered, generous rhythm */}
            <ol className="mt-6 divide-y divide-night-100 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-night-100">
              {announcement.locations.map((loc, i) => (
                <li key={i} className="flex flex-col gap-3 p-5 transition-colors hover:bg-cream sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-flame/10 text-lg font-bold text-flame">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-night-900">{loc.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-night-600">
                        <MapPin className="h-3.5 w-3.5 text-night-400" /> {loc.area}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-14 text-sm text-night-600 sm:pl-0">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gold" /> {loc.days}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gold" /> {loc.hours}
                    </span>
                    {loc.map_link && (
                      <a
                        href={loc.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-flame hover:underline"
                      >
                        Open in Maps <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}
