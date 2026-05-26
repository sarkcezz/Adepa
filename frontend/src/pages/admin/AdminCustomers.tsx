import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/axios'
import type { User } from '@/types'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminCustomers() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  function load() {
    setLoading(true)
    api.get('/admin/customers', { params: { q } })
      .then((r) => setItems(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">Customers</h1>

      <div className="card flex items-center gap-3">
        <Search className="h-4 w-4 text-night-500" />
        <Input placeholder="Search by name, phone or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr><th className="px-4 py-3">Name</th><th>Phone</th><th>Email</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td className="text-night-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
