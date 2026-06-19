"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import type { Paginated, StandAnnouncement, StandLocation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Ann = StandAnnouncement & { is_published?: boolean };
type Draft = {
  id?: string; title: string; description: string;
  start_date: string; end_date: string; is_published: boolean;
  locations: StandLocation[];
};
const BLANK_LOC: StandLocation = { name: "", area: "", days: "", hours: "", map_link: "" };
const EMPTY: Draft = { title: "", description: "", start_date: "", end_date: "", is_published: true, locations: [{ ...BLANK_LOC }] };

export default function AdminAnnouncementsPage() {
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<Ann[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!token) return;
    api<Paginated<Ann>>("/admin/announcements", { token }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }
  useEffect(load, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(a: Ann) {
    setDraft({
      id: a.id, title: a.title, description: a.description,
      start_date: a.start_date?.slice(0, 10) || "", end_date: a.end_date?.slice(0, 10) || "",
      is_published: a.is_published ?? true,
      locations: a.locations.length ? a.locations.map((l) => ({ ...l })) : [{ ...BLANK_LOC }],
    });
    setOpen(true);
  }

  function setLoc(i: number, key: keyof StandLocation, v: string) {
    setDraft((d) => ({ ...d, locations: d.locations.map((l, idx) => (idx === i ? { ...l, [key]: v } : l)) }));
  }

  async function save() {
    setSaving(true);
    const body = {
      title: draft.title, description: draft.description,
      start_date: draft.start_date, end_date: draft.end_date,
      is_published: draft.is_published,
      locations: draft.locations.filter((l) => l.name.trim()),
    };
    try {
      if (draft.id) await api(`/admin/announcements/${draft.id}`, { method: "PUT", token: token!, body: JSON.stringify(body) });
      else await api("/admin/announcements", { method: "POST", token: token!, body: JSON.stringify(body) });
      toast.success(draft.id ? "Announcement updated." : "Announcement created.");
      setOpen(false); load();
    } catch { toast.error("Could not save announcement."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Announcements</h1>
        <Button className="rounded-full" onClick={() => { setDraft({ ...EMPTY, locations: [{ ...BLANK_LOC }] }); setOpen(true); }}><Plus className="size-4" /> New announcement</Button>
      </div>

      {items === null ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(a.start_date)} – {formatDate(a.end_date)} · {a.locations.length} location{a.locations.length === 1 ? "" : "s"}</p>
                </div>
                <button onClick={() => startEdit(a)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold hover:bg-secondary"><Pencil className="size-3.5" /> Edit</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.locations.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs"><MapPin className="size-3" /> {l.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">{draft.id ? "Edit announcement" : "New announcement"}</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">{draft.id ? "Edit announcement" : "New announcement"}</h2></div>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><textarea rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Start date</Label><Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">End date</Label><Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Stand locations</Label>
                <button onClick={() => setDraft((d) => ({ ...d, locations: [...d.locations, { ...BLANK_LOC }] }))} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Plus className="size-3.5" /> Add</button>
              </div>
              <div className="space-y-3">
                {draft.locations.map((l, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Location {i + 1}</span>
                      {draft.locations.length > 1 && (
                        <button onClick={() => setDraft((d) => ({ ...d, locations: d.locations.filter((_, idx) => idx !== i) }))} className="text-destructive"><Trash2 className="size-3.5" /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Name" value={l.name} onChange={(e) => setLoc(i, "name", e.target.value)} />
                      <Input placeholder="Area" value={l.area} onChange={(e) => setLoc(i, "area", e.target.value)} />
                      <Input placeholder="Days (e.g. Mon–Fri)" value={l.days} onChange={(e) => setLoc(i, "days", e.target.value)} />
                      <Input placeholder="Hours (e.g. 8am–6pm)" value={l.hours} onChange={(e) => setLoc(i, "hours", e.target.value)} />
                      <Input placeholder="Map link (optional)" className="col-span-2" value={l.map_link ?? ""} onChange={(e) => setLoc(i, "map_link", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} className="size-4 accent-primary" /> Published (visible on store)
            </label>
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={save}>{saving ? "Saving…" : draft.id ? "Save changes" : "Create announcement"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
