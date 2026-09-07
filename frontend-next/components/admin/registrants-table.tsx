"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, Download, X, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { EventRegistration } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function exportCsv(eventName: string, regs: EventRegistration[]) {
  const header = ["Name", "WhatsApp / Phone", "Email", "Party size", "Companions", "Payment", "Checked in", "Code", "Registered"];
  const rows = regs.map((r) => [
    r.customer_name,
    r.customer_phone,
    r.customer_email || "",
    String(1 + (r.companions?.length || 0)),
    (r.companions || []).join("; "),
    r.payment_status,
    r.checked_in ? "Yes" : "No",
    r.management_code,
    r.created_at,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-registrants.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RegistrantsTable({
  eventId, eventName, regs, onChange,
}: { eventId: string; eventName: string; regs: EventRegistration[]; onChange: (regs: EventRegistration[]) => void }) {
  const token = useAuth((s) => s.token);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", email: "", companions: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  function startEdit(r: EventRegistration) {
    setEditingId(r.id);
    setDraft({
      name: r.customer_name,
      phone: r.customer_phone,
      email: r.customer_email || "",
      companions: (r.companions || []).join(", "),
    });
  }

  async function saveEdit(r: EventRegistration) {
    setBusyId(r.id);
    try {
      const companions = draft.companions.split(",").map((c) => c.trim()).filter(Boolean);
      const updated = await api<EventRegistration>(`/admin/events/${eventId}/registrations/${r.id}`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ name: draft.name, phone: draft.phone, email: draft.email || null, companions }),
      });
      onChange(regs.map((x) => (x.id === r.id ? updated : x)));
      setEditingId(null);
      toast.success("Registrant updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update registrant.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: EventRegistration) {
    if (!confirm(`Remove ${r.customer_name} from this event? This frees their spot${r.companions?.length ? "s" : ""}.`)) return;
    setBusyId(r.id);
    try {
      await api(`/admin/events/${eventId}/registrations/${r.id}`, { method: "DELETE", token: token! });
      onChange(regs.filter((x) => x.id !== r.id));
      toast.success("Registrant removed.");
    } catch {
      toast.error("Could not remove registrant.");
    } finally {
      setBusyId(null);
    }
  }

  async function checkIn(r: EventRegistration) {
    setBusyId(r.id);
    try {
      await api(`/admin/events/${eventId}/registrations/${r.id}/check-in`, { method: "POST", token: token! });
      onChange(regs.map((x) => (x.id === r.id ? { ...x, checked_in: true, payment_status: x.payment_status === "PENDING" ? "PAID" : x.payment_status } : x)));
    } catch {
      toast.error("Could not check in.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-sm text-muted-foreground">{regs.length} registrant{regs.length === 1 ? "" : "s"}</p>
        <Button variant="outline" size="sm" className="rounded-full" disabled={regs.length === 0} onClick={() => exportCsv(eventName, regs)}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">WhatsApp / Phone</th>
              <th className="pb-2 pr-3">Email</th>
              <th className="pb-2 pr-3">Party</th>
              <th className="pb-2 pr-3">Payment</th>
              <th className="pb-2 pr-3">Checked in</th>
              <th className="pb-2 pr-3">Code</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {regs.map((r) => {
              const editing = editingId === r.id;
              const busy = busyId === r.id;
              return (
                <tr key={r.id}>
                  <td className="py-2.5 pr-3 align-top">
                    {editing ? <Input className="h-8 w-40" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /> : <span className="font-medium">{r.customer_name}</span>}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    {editing ? <Input className="h-8 w-32" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /> : r.customer_phone}
                  </td>
                  <td className="py-2.5 pr-3 align-top text-muted-foreground">
                    {editing ? <Input className="h-8 w-40" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /> : (r.customer_email || "—")}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    {editing ? (
                      <Input className="h-8 w-48" placeholder="Companion names, comma separated" value={draft.companions} onChange={(e) => setDraft({ ...draft, companions: e.target.value })} />
                    ) : (
                      <span>
                        {1 + (r.companions?.length || 0)}
                        {r.companions?.length > 0 && <span className="text-muted-foreground"> ({r.companions.join(", ")})</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.payment_status === "PAID" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.payment_status}</span>
                  </td>
                  <td className="py-2.5 pr-3 align-top">
                    {r.checked_in ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-3.5" /> Yes</span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={busy} onClick={() => checkIn(r)}>Check in</Button>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 align-top font-mono text-xs text-muted-foreground">{r.management_code}</td>
                  <td className="py-2.5 align-top">
                    <div className="flex items-center gap-1">
                      {editing ? (
                        <>
                          <button onClick={() => saveEdit(r)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-primary hover:bg-primary/10" aria-label="Save">
                            <Save className="size-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Cancel edit">
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(r)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Edit registrant">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => remove(r)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove registrant">
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {regs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">No registrants yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
