import { useEffect, useState } from 'react'
import { Download, Search, X } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order, OrderStatus } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatDateTime, formatGhs } from '@/lib/formatters'
import { toast } from 'sonner'

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

/** Returns the latest value of `value` after `delay` ms of stability. */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', payment_method: '', delivery_method: '' })
  const [search, setSearch] = useState('')

  // Debounce the search so we don't fire on every keystroke
  const debouncedSearch = useDebounced(search, 300)

  function load() {
    setLoading(true)
    const params = { ...filter, q: debouncedSearch || undefined }
    api.get('/admin/orders', { params })
      .then((r) => setOrders(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter, debouncedSearch])

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status })
      toast.success('Status updated.')
      load()
    } catch { /* */ }
  }

  function exportCsv() {
    const baseURL = api.defaults.baseURL || ''
    const token = localStorage.getItem('adepa-auth') ? JSON.parse(localStorage.getItem('adepa-auth')!).state.token : ''
    const url = `${baseURL}/admin/orders/export`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl font-bold">Orders</h1>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <div className="relative min-w-[260px] flex-1">
          <label className="label">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-night-400" />
          <input
            type="search"
            placeholder="Order #, customer name, phone, paystack ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 mt-1 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-night-400 hover:bg-night-100 hover:text-night-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Payment" value={filter.payment_method} onChange={(e) => setFilter({ ...filter, payment_method: e.target.value })}>
          <option value="">All</option>
          <option value="MOMO">Mobile Money</option>
          <option value="CARD">Card</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank</option>
        </Select>
        <Select label="Delivery" value={filter.delivery_method} onChange={(e) => setFilter({ ...filter, delivery_method: e.target.value })}>
          <option value="">All</option>
          <option value="HOME">Home</option>
          <option value="PICKUP">Pickup</option>
          <option value="EVENT">Event</option>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-night-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-night-100">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="text-night-500">{formatDateTime(o.created_at)}</td>
                  <td>{o.customer?.name || '—'}<br /><span className="text-xs text-night-500">{o.customer?.phone}</span></td>
                  <td>{o.items?.length ?? 0}</td>
                  <td className="font-semibold">{formatGhs(o.total_kobo)}</td>
                  <td><span className="badge bg-night-100">{o.payment_status}</span></td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                      className="rounded-md border border-night-200 px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
