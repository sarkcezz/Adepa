"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { ShippingSettings, ShippingZone } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminShippingPage() {
  const token = useAuth((s) => s.token);
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [zones, setZones] = useState<ShippingZone[] | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({ default_fee_ghs: "", free_weight_kg: "", surcharge_per_kg_ghs: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [newZone, setNewZone] = useState({ district: "", fee_ghs: "" });
  const [addingZone, setAddingZone] = useState(false);
  const [zoneDrafts, setZoneDrafts] = useState<Record<string, string>>({});
  const [busyZoneId, setBusyZoneId] = useState<string | null>(null);

  function load() {
    if (!token) return;
    api<{ settings: ShippingSettings; zones: ShippingZone[] }>("/admin/shipping", { token }).then((r) => {
      setSettings(r.settings);
      setZones(r.zones);
      if (r.settings) {
        setSettingsDraft({
          default_fee_ghs: (r.settings.default_fee_kobo / 100).toFixed(2),
          free_weight_kg: (r.settings.free_weight_grams / 1000).toString(),
          surcharge_per_kg_ghs: (r.settings.surcharge_per_kg_kobo / 100).toFixed(2),
        });
      }
      setZoneDrafts(Object.fromEntries(r.zones.map((z) => [z.id, (z.fee_kobo / 100).toFixed(2)])));
    }).catch(() => { setSettings(null); setZones([]); });
  }
  useEffect(load, [token]);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const updated = await api<ShippingSettings>("/admin/shipping/settings", {
        method: "PUT", token: token!,
        body: JSON.stringify({
          default_fee_kobo: Math.round(parseFloat(settingsDraft.default_fee_ghs || "0") * 100),
          free_weight_grams: Math.round(parseFloat(settingsDraft.free_weight_kg || "0") * 1000),
          surcharge_per_kg_kobo: Math.round(parseFloat(settingsDraft.surcharge_per_kg_ghs || "0") * 100),
        }),
      });
      setSettings(updated);
      toast.success("Delivery settings updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function addZone() {
    if (!newZone.district.trim()) return toast.error("Enter a district name.");
    setAddingZone(true);
    try {
      const zone = await api<ShippingZone>("/admin/shipping/zones", {
        method: "POST", token: token!,
        body: JSON.stringify({ district: newZone.district.trim(), fee_kobo: Math.round(parseFloat(newZone.fee_ghs || "0") * 100) }),
      });
      setZones((prev) => [...(prev ?? []), zone].sort((a, b) => a.district.localeCompare(b.district)));
      setZoneDrafts((prev) => ({ ...prev, [zone.id]: (zone.fee_kobo / 100).toFixed(2) }));
      setNewZone({ district: "", fee_ghs: "" });
      toast.success("Zone added.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add zone.");
    } finally {
      setAddingZone(false);
    }
  }

  async function saveZone(z: ShippingZone) {
    setBusyZoneId(z.id);
    try {
      const fee_kobo = Math.round(parseFloat(zoneDrafts[z.id] || "0") * 100);
      const updated = await api<ShippingZone>(`/admin/shipping/zones/${z.id}`, {
        method: "PUT", token: token!, body: JSON.stringify({ fee_kobo }),
      });
      setZones((prev) => prev?.map((x) => (x.id === z.id ? updated : x)) ?? null);
      toast.success(`${z.district} updated.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update zone.");
    } finally {
      setBusyZoneId(null);
    }
  }

  async function removeZone(z: ShippingZone) {
    if (!confirm(`Remove the zone fee for ${z.district}? It'll fall back to the default fee.`)) return;
    setBusyZoneId(z.id);
    try {
      await api(`/admin/shipping/zones/${z.id}`, { method: "DELETE", token: token! });
      setZones((prev) => prev?.filter((x) => x.id !== z.id) ?? null);
      toast.success("Zone removed.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not remove zone.");
    } finally {
      setBusyZoneId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Delivery pricing</h1>
        <p className="text-muted-foreground">Zone fees and the free-weight allowance customers see at checkout.</p>
      </div>

      {settings === null ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Default settings</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Default fee (GHS)</Label>
              <Input type="number" step="0.01" value={settingsDraft.default_fee_ghs} onChange={(e) => setSettingsDraft({ ...settingsDraft, default_fee_ghs: e.target.value })} />
              <p className="text-xs text-muted-foreground">Used for any district without its own zone below.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Free weight allowance (kg)</Label>
              <Input type="number" step="0.1" value={settingsDraft.free_weight_kg} onChange={(e) => setSettingsDraft({ ...settingsDraft, free_weight_kg: e.target.value })} />
              <p className="text-xs text-muted-foreground">Orders under this weight pay no surcharge.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Surcharge per kg over (GHS)</Label>
              <Input type="number" step="0.01" value={settingsDraft.surcharge_per_kg_ghs} onChange={(e) => setSettingsDraft({ ...settingsDraft, surcharge_per_kg_ghs: e.target.value })} />
              <p className="text-xs text-muted-foreground">Added per kg past the free allowance, rounded up.</p>
            </div>
          </div>
          <Button className="mt-4 rounded-full" disabled={savingSettings} onClick={saveSettings}>
            {savingSettings ? "Saving…" : "Save settings"}
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">District zones</h2>
        <p className="mt-1 text-sm text-muted-foreground">A base fee per district, cheaper for areas near the shop.</p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">District</Label>
            <Input className="w-48" placeholder="e.g. Ejisu" value={newZone.district} onChange={(e) => setNewZone({ ...newZone, district: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fee (GHS)</Label>
            <Input className="w-28" type="number" step="0.01" value={newZone.fee_ghs} onChange={(e) => setNewZone({ ...newZone, fee_ghs: e.target.value })} />
          </div>
          <Button variant="outline" className="rounded-full" disabled={addingZone} onClick={addZone}>
            <Plus className="size-4" /> Add zone
          </Button>
        </div>

        <div className="mt-5 overflow-x-auto">
          {zones === null ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : zones.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No zones yet — every district uses the default fee.</p>
          ) : (
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3">District</th>
                  <th className="pb-2 pr-3">Fee (GHS)</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td className="py-2 pr-3 capitalize">{z.district}</td>
                    <td className="py-2 pr-3">
                      <Input
                        className="h-8 w-28"
                        type="number"
                        step="0.01"
                        value={zoneDrafts[z.id] ?? ""}
                        onChange={(e) => setZoneDrafts((prev) => ({ ...prev, [z.id]: e.target.value }))}
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => saveZone(z)} disabled={busyZoneId === z.id} className="grid size-7 place-items-center rounded-lg text-primary hover:bg-primary/10" aria-label={`Save ${z.district}`}>
                          <Save className="size-3.5" />
                        </button>
                        <button onClick={() => removeZone(z)} disabled={busyZoneId === z.id} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${z.district}`}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
