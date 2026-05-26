import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Flame, MapPin, Truck, ShieldCheck, Award, ChefHat } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product, StandAnnouncement, PorkEvent } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { CardSkeleton } from '@/components/common/LoadingSpinner'
import { formatDate, formatGhs } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'
import { PorkMark } from '@/components/common/PorkMark'

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
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-night text-white noise">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-32 -left-20 h-[480px] w-[480px] rounded-full bg-flame blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-[480px] w-[480px] rounded-full bg-gold blur-3xl" />
        </div>

        <div className="container-tight relative grid items-center gap-12 py-20 lg:grid-cols-[1.1fr,1fr] lg:gap-16 lg:py-28">
          {/* Copy column */}
          <div className="animate-slide-up">
            <span className="eyebrow text-gold">Premium Ghanaian pork · Est. 2024</span>

            <h1 className="display-1 mt-5 font-extrabold text-white">
              Fresh. Spiced.
              <br />
              <span className="text-gradient-warm">Ready</span> for every meal.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              From butcher-clean cuts to fire-grilled platters — Adepa serves Ghana's finest pork,
              delivered to your door or ready at our stands.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/products">
                <Button size="xl" variant="primary">
                  Order now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/locations">
                <Button
                  size="xl"
                  variant="ghost"
                  className="border border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  Find a stand
                </Button>
              </Link>
            </div>

            {/* Mini stats */}
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { value: '24',    label: 'Pack sizes' },
                { value: '3',     label: 'Spice levels' },
                { value: 'Same-day', label: 'Delivery' },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="display text-2xl font-bold text-gold sm:text-3xl">{s.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual column — editorial product card */}
          <div className="relative animate-fade-in">
            {/* Background plate */}
            <div className="absolute -inset-6 -rotate-3 rounded-[40px] bg-flame/20 blur-2xl" aria-hidden="true" />

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-flame p-1 shadow-2xl ring-1 ring-white/10">
              <div className="rounded-[28px] bg-gradient-to-br from-flame-700/90 via-flame to-flame-700 p-8">
                {/* Featured imagery — uses PorkMark as placeholder */}
                <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <PorkMark variant="event" />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    Bestseller
                  </p>
                  <h3 className="display mt-2 text-2xl font-bold text-white">
                    Adepa Family Pack
                  </h3>
                  <p className="mt-1.5 text-sm text-white/75">
                    Premium grilled pork, 800g — feeds four.
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">From</p>
                      <p className="display text-3xl font-bold text-gold leading-none">GHS 90</p>
                    </div>
                    <Link
                      to="/products"
                      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-night-900 cursor-pointer transition-all hover:bg-gold hover:scale-105 active:scale-95"
                    >
                      Order
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE STANDS BANNER ───────────────────────────────────────── */}
      {announcement && (
        <section className="border-y border-gold/20 bg-gold/5">
          <div className="container-tight flex flex-col items-start gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-night-900 shadow-gold">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="display text-base font-semibold text-night-900">{announcement.title}</p>
                <p className="mt-0.5 text-sm text-night-600">
                  {announcement.locations.length} active stand{announcement.locations.length !== 1 && 's'} · {formatDate(announcement.start_date)} → {formatDate(announcement.end_date)}
                </p>
              </div>
            </div>
            <Link
              to="/locations"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame transition-colors hover:text-flame-700 group"
            >
              View stand map
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ──────────────────────────────────────────── */}
      <section className="container-tight py-20">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Curated this week</p>
            <h2 className="display-2 mt-2">Most-loved cuts</h2>
            <p className="mt-2 max-w-md text-night-600">
              Our pitmaster's picks — handled with care from butcher to plate.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame transition-colors hover:text-flame-700 group"
          >
            View all products
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── THE ADEPA STORY ────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="container-tight grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Our story</p>
            <h2 className="display-2 mt-2">
              Heritage recipes,
              <br />
              modern craft.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-night-600">
              We started Adepa with a simple belief — that premium pork should be accessible,
              freshly butchered, and seasoned the way Ghanaian families have done for generations.
              Every cut is hand-selected. Every spice rub is mixed by us. Nothing leaves our
              kitchen we wouldn't serve our own.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-6">
              {[
                { icon: Award,      label: '100% Ghana raised',  desc: 'Local farms, ethically sourced' },
                { icon: ShieldCheck, label: 'Cold-chain sealed', desc: 'Vacuum packed, hygiene certified' },
                { icon: ChefHat,    label: 'Hand-spiced',         desc: 'Family recipes, never pre-mixed' },
                { icon: Truck,      label: 'Same-day delivery',   desc: 'Across Accra & Tema before 7pm' },
              ].map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.label} className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-flame-50 text-flame">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-night-900">{f.label}</dt>
                      <dd className="mt-0.5 text-xs text-night-500">{f.desc}</dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[32px] bg-cream shadow-medium">
                <PorkMark variant="spiced" />
              </div>
              {/* Decorative badge */}
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-night-900 p-5 text-white shadow-2xl sm:block">
                <p className="display text-4xl font-bold text-gold">10k+</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">Meals served</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENT ─────────────────────────────────────────────── */}
      {event && (
        <section className="relative overflow-hidden bg-gradient-night py-20 text-white noise">
          <div className="pointer-events-none absolute top-1/2 right-0 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl" />

          <div className="container-tight relative grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-gold">Upcoming event</p>
              <h2 className="display-2 mt-2 text-white">{event.name}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/75">{event.description}</p>

              <ul className="mt-7 space-y-3 text-sm text-white/85">
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                    <Calendar className="h-4 w-4 text-gold" />
                  </span>
                  {formatDate(event.event_date)} at {event.event_time.slice(0, 5)}
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                    <MapPin className="h-4 w-4 text-gold" />
                  </span>
                  {event.venue_name}
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                    <Flame className="h-4 w-4 text-gold" />
                  </span>
                  Flat rate {formatGhs(event.flat_rate_kobo)} · {event.capacity - event.registered_count} slots left
                </li>
              </ul>

              <div className="mt-8">
                <Link to="/events">
                  <Button size="lg" variant="gold">Reserve a seat</Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[40px] bg-gold/10 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-[32px] bg-white/[0.04] p-8 ring-1 ring-white/10 backdrop-blur">
                <div className="aspect-square overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <PorkMark variant="event" />
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/60">Capacity</p>
                    <p className="display mt-1 text-3xl font-bold">
                      {event.capacity - event.registered_count}
                      <span className="text-base font-normal text-white/50"> / {event.capacity}</span>
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-gold">
                    {Math.round((event.registered_count / event.capacity) * 100)}% booked
                  </p>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-flame transition-all duration-700"
                    style={{ width: `${(event.registered_count / event.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="display-2 mt-2">Three steps to plate</h2>
            <p className="mt-3 text-night-600">
              Whether you're picking up at a stand or ordering for home — we make it effortless.
            </p>
          </div>

          <ol className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              { num: '01', title: 'Choose your cut',      desc: 'Browse raw, spiced, or ready-to-eat options across our menu.' },
              { num: '02', title: 'Pay securely',          desc: 'Pay with Mobile Money or card — Paystack secured.' },
              { num: '03', title: 'Receive same-day',      desc: 'Cold-chain delivery across Accra & Tema, or pickup at a stand.' },
            ].map((s) => (
              <li key={s.num} className="group relative rounded-3xl bg-cream p-8 ring-1 ring-night-100 transition-all hover:-translate-y-1 hover:shadow-medium">
                <p className="display text-5xl font-bold text-flame/20 transition-colors group-hover:text-flame/40">
                  {s.num}
                </p>
                <h3 className="display mt-4 text-xl font-bold text-night-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-night-600">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA FOOTER STRIP ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-flame text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container-tight relative grid items-center gap-8 py-16 sm:grid-cols-[1fr,auto]">
          <div>
            <h2 className="display-2 text-white">
              Hungry yet?
            </h2>
            <p className="mt-2 text-white/85">
              Get your first pack delivered today. No subscription, no hassle.
            </p>
          </div>
          <Link to="/products">
            <Button size="xl" variant="gold">
              Browse the menu <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
