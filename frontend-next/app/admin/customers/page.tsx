"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import type { Paginated, User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCustomersPage() {
  const token = useAuth((s) => s.token);
  const [list, setList] = useState<(User & { created_at?: string })[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!token) return;
    api<Paginated<User & { created_at?: string }>>("/admin/customers", { token })
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  }, [token]);

  const filtered = useMemo(() => {
    if (!list) return null;
    const s = q.toLowerCase().trim();
    if (!s) return list;
    return list.filter((c) => [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(s)));
  }, [list, q]);

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
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Joined</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.created_at ? formatDate(c.created_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
