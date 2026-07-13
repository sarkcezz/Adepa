// Rendered at request time so same-origin /api is reachable (self-contained backend).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Calendar, Clock, MapPin, ArrowUpRight } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { Paginated, StandAnnouncement } from "@/lib/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Stand locations",
  description: "Find Adepa at a stand near you this week — markets and campuses across Kumasi.",
};

async function getStands(): Promise<StandAnnouncement[]> {
  try {
    const res = await publicApi<Paginated<StandAnnouncement> | { data: StandAnnouncement[] }>("/announcements/active", 60);
    return (res as { data: StandAnnouncement[] }).data ?? [];
  } catch {
    return [];
  }
}

export default async function StandsPage() {
  const announcements = await getStands();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <span className="eyebrow">This week</span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">Where to find us</h1>
        <p className="mt-2 text-muted-foreground">Fresh from the stand — visit any location near you.</p>
      </header>

      {announcements.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No active stands right now. Check back soon — new locations are announced weekly.
        </p>
      ) : (
        announcements.map((a) => (
          <section key={a.id} className="mb-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-accent/40 pb-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{a.title}</h2>
              <span className="text-sm font-medium text-muted-foreground">
                {formatDate(a.start_date)} – {formatDate(a.end_date)}
              </span>
            </div>
            {a.description && <p className="mt-3 max-w-2xl text-muted-foreground">{a.description}</p>}

            <ol className="mt-6 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              {a.locations.map((loc, i) => (
                <li key={i} className="flex flex-col gap-3 p-5 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-[family-name:var(--font-display)] text-lg font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{loc.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 text-muted-foreground" /> {loc.area}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-14 text-sm text-muted-foreground sm:pl-0">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="size-4 text-accent" /> {loc.days}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-accent" /> {loc.hours}</span>
                    {loc.map_link && (
                      <a href={loc.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                        Open in Maps <ArrowUpRight className="size-3.5" />
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
  );
}