"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { Campaign, Paginated } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Draft = {
  id?: string; name: string; code: string;
  discount_type: Campaign["discount_type"]; value: string;
  min_order_ghs: string; max_usage: string;
  valid_from: string; valid_to: string; is_active: boolean;
};
const EMPTY: Draft = { name: "", code: "", discount_type: "PERCENT", value: "10", min_order_ghs: "", max_usage: "", valid_from: "", valid_to: "", is_active: true };

function toLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminCampaignsPage() {
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<Campaign[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!token) return;
    api<Paginated<Campaign>>("/admin/campaigns", { token }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }
  useEffect(load, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(c: Campaign) {
    setDraft({
      id: c.id, name: c.name, code: c.code, discount_type: c.discount_type,
      value: c.discount_type === "FIXED" ? (c.discount_value / 100).toFixed(2) : String(c.discount_value),
      min_order_ghs: c.min_order_kobo ? (c.min_order_kobo / 100).toFixed(2) : "",
      max_usage: c.max_usage ? String(c.max_usage) : "",
      valid_from: toLocal(c.valid_from), valid_to: toLocal(c.valid_to), is_active: c.is_active,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const body = {
      name: draft.name, code: draft.code, discount_type: draft.discount_type,
      discount_value: draft.discount_type === "FIXED" ? Math.round(parseFloat(draft.value || "0") * 100) : Number(draft.value || 0),
      min_order_kobo: draft.min_order_ghs ? Math.round(parseFloat(draft.min_order_ghs) * 100) : 0,
      max_usage: draft.max_usage ? Number(draft.max_usage) : null,
      valid_from: draft.valid_from || null, valid_to: draft.valid_to || null, is_active: draft.is_active,
    };
    try {
      if (draft.id) await api(`/admin/campaigns/${draft.id}`, { method: "PUT", token: token!, body: JSON.stringify(body) });
      else await api("/admin/campaigns", { method: "POST", token: token!, body: JSON.stringify(body) });
      toast.success(draft.id ? "Campaign updated." : "Campaign created.");
      setOpen(false); load();
    } catch { toast.error("Could not save campaign."); }
    finally { setSaving(false); }
  }

  async function toggle(c: Campaign) {
    try {
      await api(`/admin/campaigns/${c.id}/toggle`, { method: "PATCH", token: token! });
      setItems((prev) => prev?.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x) ?? null);
    } catch { toast.error("Could not toggle."); }
  }

  const valueLabel = (c: Campaign) =>
    c.discount_type === "PERCENT" ? `${c.discount_value}%` : c.discount_type === "FIXED" ? formatGhs(c.discount_value) : "Free delivery";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Campaigns</h1>
        <Button className="rounded-full" onClick={() => { setDraft(EMPTY); setOpen(true); }}><Plus className="size-4" /> New campaign</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {items === null ? (
          <div className="space-y-px p-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 font-semibold">Code</th><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Value</th><th className="px-4 py-3 font-semibold">Used</th><th className="px-4 py-3 font-semibold">Valid until</th><th className="px-4 py-3 font-semibold">Status</th><th /></tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{valueLabel(c)}</td>
                    <td className="px-4 py-3 tabular-nums">{c.usage_count}{c.max_usage ? `/${c.max_usage}` : ""}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.valid_to)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.is_active ? "On" : "Off"}</span></td>
                    <td className="px-2 py-3"><div className="flex gap-1">
                      <button onClick={() => startEdit(c)} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="size-4" /></button>
                      <button onClick={() => toggle(c)} className="rounded-lg p-2 hover:bg-secondary"><Power className="size-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">{draft.id ? "Edit campaign" : "New campaign"}</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">{draft.id ? "Edit campaign" : "New campaign"}</h2></div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
              <Fld label="Code" value={draft.code} onChange={(v) => setDraft({ ...draft, code: v.toUpperCase() })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" value={draft.discount_type} onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as Campaign["discount_type"] })}>
                  <option value="PERCENT">Percent</option>
                  <option value="FIXED">Fixed (GHS)</option>
                  <option value="FREE_DELIVERY">Free delivery</option>
                </select>
              </div>
              {draft.discount_type !== "FREE_DELIVERY" && (
                <Fld label={draft.discount_type === "PERCENT" ? "Percent" : "Amount (GHS)"} type="number" value={draft.value} onChange={(v) => setDraft({ ...draft, value: v })} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Min order (GHS)" type="number" value={draft.min_order_ghs} onChange={(v) => setDraft({ ...draft, min_order_ghs: v })} />
              <Fld label="Max uses (blank = ∞)" type="number" value={draft.max_usage} onChange={(v) => setDraft({ ...draft, max_usage: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Valid from" type="datetime-local" value={draft.valid_from} onChange={(v) => setDraft({ ...draft, valid_from: v })} />
              <Fld label="Valid to" type="datetime-local" value={draft.valid_to} onChange={(v) => setDraft({ ...draft, valid_to: v })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="size-4 accent-primary" /> Active
            </label>
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={save}>{saving ? "Saving…" : draft.id ? "Save changes" : "Create campaign"}</Button>
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
