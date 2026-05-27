import { useEffect, useState } from 'react'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/axios'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatDateTime } from '@/lib/formatters'

interface AuditLog {
  id: string
  user_name: string | null
  user_role: string | null
  action: string
  subject_type: string | null
  subject_id: string | null
  subject_label: string | null
  changes: Record<string, any> | null
  note: string | null
  ip: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  product:  'bg-blue-100 text-blue-700',
  employee: 'bg-flame-50 text-flame',
  campaign: 'bg-gold/20 text-gold-700',
  event:    'bg-purple-100 text-purple-700',
  order:    'bg-green-100 text-green-700',
  auth:     'bg-night-100 text-night-700',
}

function actionTone(action: string): string {
  const prefix = action.split('.')[0]
  return ACTION_COLORS[prefix] || 'bg-night-100 text-night-700'
}

export default function AdminAuditLogs() {
  const [items, setItems]   = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [lastPage, setLast]   = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  function load(p = page, q = search) {
    setLoading(true)
    api.get('/admin/audit-logs', { params: { page: p, q: q || undefined } })
      .then((r) => {
        setItems(r.data.data || [])
        setLast(r.data.last_page || 1)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1, search) }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl font-bold">Audit log</h1>
          <p className="text-sm text-night-500">Every admin write action — who, when, what changed.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night-400" />
          <Input
            placeholder="Search subject, user, note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {items.length === 0 ? (
            <div className="card text-center text-sm text-night-500">
              <FileText className="mx-auto mb-2 h-6 w-6 text-night-300" />
              No log entries match your filter.
            </div>
          ) : (
            <div className="card p-0">
              <ul className="divide-y divide-night-100">
                {items.map((log) => (
                  <li key={log.id} className="px-4 py-3">
                    <button
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="flex w-full items-start justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${actionTone(log.action)}`}>
                            {log.action}
                          </span>
                          {log.subject_label && (
                            <span className="text-sm font-medium text-night-900">
                              {log.subject_label}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-night-500">
                          {log.user_name || 'system'}
                          {log.user_role && <span className="ml-1 font-mono text-night-400">({log.user_role})</span>}
                          {' · '}
                          {formatDateTime(log.created_at)}
                          {log.ip && <span className="ml-1 font-mono text-night-400"> · {log.ip}</span>}
                        </p>
                        {log.note && <p className="mt-1 text-xs italic text-night-600">{log.note}</p>}
                      </div>
                    </button>

                    {expanded === log.id && log.changes && (
                      <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-night-50 p-3 text-[11px] text-night-700">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p, search) }}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-night-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-night-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="text-sm text-night-500">Page {page} of {lastPage}</span>
              <button
                onClick={() => { const p = Math.min(lastPage, page + 1); setPage(p); load(p, search) }}
                disabled={page === lastPage}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-night-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-night-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
