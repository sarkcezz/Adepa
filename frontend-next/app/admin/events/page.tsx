"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { PorkEvent, Paginated } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Draft = {
  id?: string; name: string; event_date: string; event_time: string;
  venue_name: string; venue_address: string; flat_rate_ghs: string;
  capacity: string; description: string; image_url: string; status: "DRAFT" | "PUBLISHED";
};
const EMPTY: Draft = { name: "", event_date: "", event_time: "18:00", venue_name: "", venue_address: "", flat_rate_ghs: "80", capacity: "50", description: "", image_url: "", status: "PUBLISHED" };

export default function AdminEventsPage() {
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<PorkEvent[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!token) return;
    api<Paginated<PorkEvent>>("/admin/events", { token }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }
  useEffect(load, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(e: PorkEvent) {
    setDraft({
      id: e.id, name: e.name, event_date: e.event_date, event_time: e.event_time?.slice(0, 5) || "18:00",
      venue_name: e.venue_name, venue_address: e.venue_address, flat_rate_ghs: (e.flat_rate_kobo / 100).toFixed(2),
      capacity: String(e.capacity), description: e.description || "", image_url: e.image_url || "",
      status: e.status === "CANCELLED" ? "DRAFT" : e.status,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const body = {
      name: draft.name, event_date: draft.event_date, event_time: draft.event_time,
      venue_name: draft.venue_name, venue_address: draft.venue_address,
      flat_rate_kobo: Math.round(parseFloat(draft.flat_rate_ghs || "0") * 100),
      capacity: Number(draft.capacity), description: draft.description,
      image_url: draft.image_url || null, status: draft.status,
    };
    try {
      if (draft.id) await api(`/admin/events/${draft.id}`, { method: "PUT", token: token!, body: JSON.stringify(body) });
      else await api("/admin/events", { method: "POST", token: token!, body: JSON.stringify(body) });
      toast.success(draft.id ? "Event updated." : "Event created.");
      setOpen(false); load();
    } catch { toast.error("Could not save event."); }
    finally { setSaving(false); }
  }

  async function cancel(e: PorkEvent) {
    if (!confirm("Cancel this event? Registered attendees will be notified.")) return;
    try { await api(`/admin/events/${e.id}/cancel`, { method: "POST", token: token! }); toast.success("Event cancelled."); load(); }
    catch { toast.error("Could not cancel."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Events</h1>
        <Button className="rounded-full" onClick={() => { setDraft(EMPTY); setOpen(true); }}><Plus className="size-4" /> New event</Button>
      </div>

      {items === null ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((e) => (
            <div key={e.id} className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-display)] truncate text-xl font-bold">{e.name}</h3>
                  <p className="truncate text-sm text-muted-foreground">{formatDate(e.event_date)} · {e.event_time?.slice(0, 5)} · {e.venue_name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "PUBLISHED" ? "bg-primary/10 text-primary" : e.status === "CANCELLED" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{e.status}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">{e.registered_count}/{e.capacity} · <strong>{formatGhs(e.flat_rate_kobo)}</strong></span>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(e)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold hover:bg-secondary"><Pencil className="size-3.5" /> Edit</button>
                  {e.status !== "CANCELLED" && <button onClick={() => cancel(e)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"><XCircle className="size-3.5" /> Cancel</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">{draft.id ? "Edit event" : "New event"}</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">{draft.id ? "Edit event" : "New event"}</h2></div>
          <div className="space-y-4 p-6">
            <Fld label="Event name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Date" type="date" value={draft.event_date} onChange={(v) => setDraft({ ...draft, event_date: v })} />
              <Fld label="Time" type="time" value={draft.event_time} onChange={(v) => setDraft({ ...draft, event_time: v })} />
            </div>
            <Fld label="Venue name" value={draft.venue_name} onChange={(v) => setDraft({ ...draft, venue_name: v })} />
            <Fld label="Venue address" value={draft.venue_address} onChange={(v) => setDraft({ ...draft, venue_address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Flat rate (GHS)" type="number" value={draft.flat_rate_ghs} onChange={(v) => setDraft({ ...draft, flat_rate_ghs: v })} />
              <Fld label="Capacity" type="number" value={draft.capacity} onChange={(v) => setDraft({ ...draft, capacity: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "DRAFT" | "PUBLISHED" })}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <Fld label="Image URL (optional)" value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={save}>{saving ? "Saving…" : draft.id ? "Save changes" : "Create event"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Fld({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
