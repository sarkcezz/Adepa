import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Flame, MapPin, Truck, Sparkles } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product, StandAnnouncement, PorkEvent } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { CardSkeleton } from '@/components/common/LoadingSpinner'
import { formatDate, formatGhs } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const [products,     setProducts]     = useState<Product[]>([])
  const [announcement, setAnnouncement] = useState<StandAnnouncement | null>(null)
  const [event,        setEvent]        = useState<PorkEvent | null>(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products', { params: { active_only: 1 } }),
      api.get('/announcements/active'),
      api.get('/events/upcoming'),
    ])
      .then(([p, a, e]) => {
        setProducts(p.data.data.slice(0, 3))
        setAnnouncement(a.data.data[0] || null)
        setEvent(e.data.data[0] || null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-night-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-flame blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container-tight relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Premium Ghanaian pork
            </div>
            <h1 className="display mb-4 text-4xl font-extrabold leading-tight md:text-6xl">
              Fresh. Spiced. <span className="text-gold">Ready</span> for Every Meal.
            </h1>
            <p className="mb-7 max-w-lg text-lg text-white/80">
              From butcher-clean cuts to fire-grilled platters — Adepa Pork Hub serves Ghana's finest pork, delivered to your door or ready at our stands.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products"><Button size="lg">Order now <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/locations"><Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">Find a stand</Button></Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
              <div><p className="text-2xl font-bold text-gold">24</p><p className="text-white/60">Pack sizes</p></div>
              <div><p className="text-2xl font-bold text-gold">3</p><p className="text-white/60">Spice levels</p></div>
              <div><p className="text-2xl font-bold text-gold">7-day</p><p className="text-white/60">Fresh delivery</p></div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-flame to-flame-700 p-8 shadow-2xl">
              <div className="text-7xl">🍖</div>
              <h3 className="display mt-4 text-2xl font-bold">Adepa Family Pack</h3>
              <p className="mt-1 text-sm text-white/80">Premium grilled pork — 800g, feeds 4.</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-3xl font-bold text-gold">GHS 90</span>
                <Link to="/products" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-night-900 hover:bg-gold">Order</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active stands */}
      {announcement && (
        <section className="bg-gold/10 py-6">
          <div className="container-tight flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-night-900">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-night-900">{announcement.title}</p>
                <p className="text-sm text-night-600">{announcement.locations.length} active stand{announcement.locations.length !== 1 && 's'} — {formatDate(announcement.start_date)} → {formatDate(announcement.end_date)}</p>
              </div>
            </div>
            <Link to="/locations" className="text-sm font-semibold text-flame hover:underline">View stand map →</Link>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container-tight py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="display text-3xl font-bold">Featured this week</h2>
            <p className="mt-1 text-night-600">Our most-loved picks.</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-flame hover:underline">All products →</Link>
        </div>
        {loading ? <CardSkeleton count={3} /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Upcoming event */}
      {event && (
        <section className="bg-night-900 py-16 text-white">
          <div className="container-tight grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">
                <Calendar className="h-3.5 w-3.5" /> Upcoming event
              </div>
              <h2 className="display mb-3 text-3xl font-bold">{event.name}</h2>
              <p className="mb-5 max-w-md text-white/80">{event.description}</p>
              <ul className="mb-6 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {formatDate(event.event_date)} at {event.event_time.slice(0, 5)}</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {event.venue_name}</li>
                <li className="flex items-center gap-2"><Flame className="h-4 w-4 text-gold" /> Flat rate {formatGhs(event.flat_rate_kobo)} • {event.capacity - event.registered_count} slots left</li>
              </ul>
              <Link to="/events"><Button variant="gold">Reserve a seat</Button></Link>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-gold/20 to-flame/20 p-8 ring-1 ring-white/10">
              <div className="text-8xl">🎉</div>
              <p className="mt-4 text-2xl font-bold">{event.capacity - event.registered_count}<span className="text-base font-normal text-white/60"> / {event.capacity} slots left</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gold" style={{ width: `${(event.registered_count / event.capacity) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="container-tight grid gap-6 py-16 md:grid-cols-3">
        {[
          { icon: Flame, title: 'Spiced just right',    desc: 'From mild to fiery — recipes perfected over generations.' },
          { icon: Truck, title: 'Delivered same day',   desc: 'Order before 3pm, get it the same day across Accra & Tema.' },
          { icon: MapPin, title: 'Stands you can find', desc: 'Visit us at markets and campuses — fresh cuts on the spot.' },
        ].map((f, i) => {
          const Icon = f.icon
          return (
            <div key={i} className="card text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-flame/10 text-flame">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-night-600">{f.desc}</p>
            </div>
          )
        })}
      </section>
    </>
  )
}
