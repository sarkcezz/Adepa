"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Save, X, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import type { Paginated, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Customer = User & { created_at?: string };

export default function AdminCustomersPage() {
  const token = useAuth((s) => s.token);
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", email: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Paginated<Customer>>("/admin/customers", { token })
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  }, [token]);

  const filtered = useMemo(() => {
    if (!list) return null;
    const s = q.toLowerCase().trim();
    if (!s) return list;
    return list.filter((c) => [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(s)));
  }, [list, q]);

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setDraft({ name: c.name, phone: c.phone, email: c.email || "" });
  }

  async function saveEdit(c: Customer) {
    setBusyId(c.id);
    try {
      const updated = await api<Customer>(`/admin/customers/${c.id}`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ name: draft.name, phone: draft.phone, email: draft.email || null }),
      });
      setList((prev) => prev?.map((x) => (x.id === c.id ? updated : x)) ?? null);
      setEditingId(null);
      toast.success("Customer updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update customer.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(c: Customer) {
    setBusyId(c.id);
    try {
      const updated = await api<Customer>(`/admin/customers/${c.id}/status`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      setList((prev) => prev?.map((x) => (x.id === c.id ? updated : x)) ?? null);
      toast.success(updated.is_active ? "Customer reactivated." : "Customer deactivated — their sessions were signed out.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not change status.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c: Customer) {
    if (!confirm(`Delete ${c.name}? This can't be undone.`)) return;
    setBusyId(c.id);
    try {
      await api(`/admin/customers/${c.id}`, { method: "DELETE", token: token! });
      setList((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
      toast.success("Customer deleted.");
    } catch (e) {
      // A customer with orders can't be deleted — the API explains why.
      toast.error(e instanceof ApiError ? e.message : "Could not delete customer.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Customers</h1>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {filtered === null ? (
          <div className="space-y-px p-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const editing = editingId === c.id;
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">
                        {editing ? <Input className="h-8 w-40" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /> : c.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {editing ? <Input className="h-8 w-32" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /> : c.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {editing ? <Input className="h-8 w-48" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /> : (c.email || "—")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.created_at ? formatDate(c.created_at) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {c.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {editing ? (
                            <>
                              <button onClick={() => saveEdit(c)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-primary hover:bg-primary/10" aria-label="Save">
                                <Save className="size-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Cancel edit">
                                <X className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(c)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label={`Edit ${c.name}`}>
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => toggleActive(c)}
                                disabled={busy}
                                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                                aria-label={c.is_active ? `Deactivate ${c.name}` : `Reactivate ${c.name}`}
                                title={c.is_active ? "Deactivate" : "Reactivate"}
                              >
                                {c.is_active ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                              </button>
                              <button onClick={() => remove(c)} disabled={busy} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${c.name}`}>
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Deleting only works for customers with no orders — anyone who has ordered can be deactivated instead, which signs them out and blocks sign-in while keeping their order history.
      </p>
    </div>
  );
}
