"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, UserCheck, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import type { EventRegistration, PorkEvent } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistrantsTable } from "@/components/admin/registrants-table";

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function EventRegistrantsPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuth((s) => s.token);
  const [event, setEvent] = useState<PorkEvent | null>(null);
  const [regs, setRegs] = useState<EventRegistration[] | null>(null);

  useEffect(() => {
    if (!token) return;
    api<PorkEvent>(`/admin/events/${id}`, { token }).then(setEvent).catch(() => setEvent(null));
    api<{ data: EventRegistration[] }>(`/admin/events/${id}/registrations`, { token })
      .then((r) => setRegs(r.data))
      .catch(() => setRegs([]));
  }, [token, id]);

  const attendees = (regs ?? []).reduce((n, r) => n + 1 + (r.companions?.length || 0), 0);
  const checkedIn = (regs ?? []).filter((r) => r.checked_in).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to events
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">Registrants</h1>
        <p className="text-muted-foreground">
          {event ? event.name : <span className="inline-block h-5 w-40 animate-pulse rounded bg-muted align-middle" />}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={Users}
          label="Attendees"
          value={event ? `${attendees} / ${event.capacity}` : "—"}
        />
        <Stat icon={UserCheck} label="Checked in" value={regs ? `${checkedIn} of ${regs.length}` : "—"} />
        <Stat
          icon={CalendarDays}
          label="Event date"
          value={event ? `${formatDate(event.event_date)} · ${event.event_time?.slice(0, 5)}` : "—"}
        />
      </div>

      {regs === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : (
        <RegistrantsTable eventId={id} eventName={event?.name ?? "event"} regs={regs} onChange={setRegs} />
      )}
    </div>
  );
}
