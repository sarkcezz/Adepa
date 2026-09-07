"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Trash2, Download, X, Save, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { EventRegistration } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Filter = "ALL" | "CHECKED_IN" | "NOT_CHECKED_IN" | "PAID" | "PENDING";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NOT_CHECKED_IN", label: "Not checked in" },
  { value: "CHECKED_IN", label: "Checked in" },
  { value: "PENDING", label: "Payment pending" },
  { value: "PAID", label: "Paid" },
];

const partySize = (r: EventRegistration) => 1 + (r.companions?.length || 0);

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function exportCsv(eventName: string, regs: EventRegistration[]) {
  const header = ["Name", "WhatsApp / Phone", "Email", "Party size", "Companions", "Payment", "Checked in", "Code", "Registered"];
  const rows = regs.map((r) => [
    r.customer_name,
    r.customer_phone,
    r.customer_email || "",
    String(partySize(r)),
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [bulkBusy, setBulkBusy] = useState(false);

  const visible = useMemo(() => {
    const s = q.toLowerCase().trim();
    return regs.filter((r) => {
      if (filter === "CHECKED_IN" && !r.checked_in) return false;
      if (filter === "NOT_CHECKED_IN" && r.checked_in) return false;
      if (filter === "PAID" && r.payment_status !== "PAID") return false;
      if (filter === "PENDING" && r.payment_status !== "PENDING") return false;
      if (!s) return true;
      return [r.customer_name, r.customer_phone, r.customer_email, r.management_code, ...(r.companions || [])]
        .some((v) => v?.toLowerCase().includes(s));
    });
  }, [regs, q, filter]);

  // Selection only ever refers to rows the filters are actually showing.
  const visibleIds = visible.map((r) => r.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const selectedRows = regs.filter((r) => selected.has(r.id));
  const selectedSpots = selectedRows.reduce((n, r) => n + partySize(r), 0);

  function toggleAllVisible() {
    const next = new Set(selected);
    if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
    setSelected(next);
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

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
    if (!confirm(`Remove ${r.customer_name} from this event? This frees ${partySize(r)} spot${partySize(r) === 1 ? "" : "s"}.`)) return;
    setBusyId(r.id);
    try {
      await api(`/admin/events/${eventId}/registrations/${r.id}`, { method: "DELETE", token: token! });
      onChange(regs.filter((x) => x.id !== r.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(r.id);
        return next;
      });
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

  async function bulkCheckIn() {
    const ids = selectedRows.filter((r) => !r.checked_in).map((r) => r.id);
    if (!ids.length) return toast.info("Everyone selected is already checked in.");
    setBulkBusy(true);
    try {
      await api(`/admin/events/${eventId}/registrations/bulk`, {
        method: "POST", token: token!, body: JSON.stringify({ action: "check-in", ids }),
      });
      const set = new Set(ids);
      onChange(regs.map((x) => (set.has(x.id) ? { ...x, checked_in: true, payment_status: x.payment_status === "PENDING" ? "PAID" : x.payment_status } : x)));
      setSelected(new Set());
      toast.success(`Checked in ${ids.length} registrant${ids.length === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not check in.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    const ids = selectedRows.map((r) => r.id);
    if (!confirm(`Remove ${ids.length} booking${ids.length === 1 ? "" : "s"}, freeing ${selectedSpots} spot${selectedSpots === 1 ? "" : "s"}? This can't be undone.`)) return;
    setBulkBusy(true);
    try {
      await api(`/admin/events/${eventId}/registrations/bulk`, {
        method: "POST", token: token!, body: JSON.stringify({ action: "delete", ids }),
      });
      const set = new Set(ids);
      onChange(regs.filter((x) => !set.has(x.id)));
      setSelected(new Set());
      toast.success(`Removed ${ids.length} booking${ids.length === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not remove registrants.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, phone, email, code…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <Button variant="outline" size="sm" className="rounded-full" disabled={visible.length === 0} onClick={() => exportCsv(eventName, visible)}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold">
            {selected.size} selected <span className="font-normal text-muted-foreground">· {selectedSpots} spot{selectedSpots === 1 ? "" : "s"}</span>
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" disabled={bulkBusy} onClick={bulkCheckIn}>
              <UserCheck className="size-3.5" /> Check in
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" disabled={bulkBusy} onClick={() => exportCsv(eventName, selectedRows)}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={bulkBusy}
              onClick={bulkDelete}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all registrants"
                  />
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">WhatsApp / Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Checked in</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const editing = editingId === r.id;
                const busy = busyId === r.id;
                const isSelected = selected.has(r.id);
                return (
                  <tr key={r.id} className={`border-t border-border/60 ${isSelected ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={isSelected}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select ${r.customer_name}`}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {editing ? <Input className="h-8 w-40" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /> : <span className="font-medium">{r.customer_name}</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {editing ? <Input className="h-8 w-32" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /> : r.customer_phone}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {editing ? <Input className="h-8 w-48" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /> : (r.customer_email || "—")}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {editing ? (
                        <Input className="h-8 w-48" placeholder="Companion names, comma separated" value={draft.companions} onChange={(e) => setDraft({ ...draft, companions: e.target.value })} />
                      ) : (
                        <span>
                          {partySize(r)}
                          {r.companions?.length > 0 && <span className="text-muted-foreground"> ({r.companions.join(", ")})</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.payment_status === "PAID" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.payment_status}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {r.checked_in ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-3.5" /> Yes</span>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={busy} onClick={() => checkIn(r)}>Check in</Button>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{r.management_code}</td>
                    <td className="px-4 py-3 align-top">
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
                            <button onClick={() => startEdit(r)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label={`Edit ${r.customer_name}`}>
                              <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => remove(r)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${r.customer_name}`}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {regs.length === 0 ? "No registrants yet." : "No registrants match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {visible.length} of {regs.length} booking{regs.length === 1 ? "" : "s"}. Select-all applies to the rows currently shown.
      </p>
    </div>
  );
}
