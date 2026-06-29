import type { Metadata } from "next";
import Script from "next/script";
import { Calendar, MapPin, Users } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { PorkEvent } from "@/lib/types";
import { formatGhs, formatDate } from "@/lib/format";
import { EventRegister } from "@/components/site/event-register";

export const metadata: Metadata = {
  title: "Pork events",
  description: "Monthly eat-and-drink gatherings. Flat rate, everything included.",
};

async function getEvents(): Promise<PorkEvent[]> {
  try {
    const res = await publicApi<{ data: PorkEvent[] }>("/events/upcoming", 60);
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <header className="mb-8 max-w-2xl">
        <span className="eyebrow">Gather round</span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">Pork events</h1>
        <p className="mt-2 text-muted-foreground">Monthly eat-and-drink gatherings. Flat rate, everything included.</p>
      </header>

      {events.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No upcoming events. Check back soon — our next pork night will be announced.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {events.map((e) => {
            const left = e.capacity - e.registered_count;
            const pct = Math.min(100, Math.round((e.registered_count / e.capacity) * 100));
            return (
              <div key={e.id} className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                <div className="relative h-40 bg-gradient-to-br from-primary to-primary/60">
                  <span className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary">
                    {left > 0 ? `${left} slots left` : "Sold out"}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{e.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><Calendar className="size-4 text-accent" /> {formatDate(e.event_date)} · {e.event_time?.slice(0, 5)}</li>
                    <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" /> {e.venue_name}</li>
                    <li className="flex items-center gap-2"><Users className="size-4 text-accent" /> Capacity {e.capacity}</li>
                  </ul>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary">{formatGhs(e.flat_rate_kobo)}</span>
                    <EventRegister eventId={e.id} amountKobo={e.flat_rate_kobo} soldOut={left <= 0} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
