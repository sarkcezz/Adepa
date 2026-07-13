"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import type { AuditLog, Paginated } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const TONE: Record<string, string> = {
  product: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  employee: "bg-primary/10 text-primary",
  campaign: "bg-accent/20 text-accent-foreground",
  event: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  order: "bg-primary/15 text-primary",
  auth: "bg-muted text-muted-foreground",
};
const tone = (a: string) => TONE[a.split(".")[0]] ?? "bg-muted text-muted-foreground";

export default function AdminAuditLogsPage() {
  const token = useAuth((s) => s.token);
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => {
      setLogs(null);
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set("q", q);
      api<Paginated<AuditLog>>(`/admin/audit-logs?${params}`, { token })
        .then((r) => { setLogs(r.data); setLastPage(r.last_page); })
        .catch(() => setLogs([]));
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [token, q, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Every admin write action — who, when, what.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search subject, user, note…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
        </div>
      </div>

      {logs === null ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : logs.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="size-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No entries match.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
            {logs.map((l) => (
              <li key={l.id} className="px-4 py-3">
                <button onClick={() => setExpanded(expanded === l.id ? null : l.id)} className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone(l.action)}`}>{l.action}</span>
                      {l.subject_label && <span className="text-sm font-medium">{l.subject_label}</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.user_name || "system"}{l.user_role && <span className="ml-1 font-mono">({l.user_role})</span>} · {formatDate(l.created_at)}{l.ip && <span className="ml-1 font-mono"> · {l.ip}</span>}
                    </p>
                    {l.note && <p className="mt-1 text-xs italic text-muted-foreground">{l.note}</p>}
                  </div>
                </button>
                {expanded === l.id && l.changes && (
                  <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-secondary/60 p-3 text-[11px]">{JSON.stringify(l.changes, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-50">
                <ChevronLeft className="size-3.5" /> Prev
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-50">
                Next <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
