import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs } from '@/lib/formatters'
import { Select } from '@/components/ui/Select'

export default function AdminAnalytics() {
  const [period, setPeriod]   = useState('daily')
  const [revenue, setRevenue] = useState<any[]>([])
  const [emps,    setEmps]    = useState<any[]>([])
  const [camps,   setCamps]   = useState<any[]>([])
  const [custs,   setCusts]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/analytics/revenue', { params: { period } }),
      api.get('/admin/analytics/employees'),
      api.get('/admin/analytics/campaigns'),
      api.get('/admin/analytics/customers'),
    ]).then(([r, e, ca, cu]) => {
      setRevenue(r.data.data || [])
      setEmps(e.data.data || [])
      setCamps(ca.data.data || [])
      setCusts(cu.data.data || [])
    }).finally(() => setLoading(false))
  }, [period])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-3xl font-bold">Analytics</h1>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Revenue</h2>
        <RevenueChart data={revenue} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Employee performance</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-night-500">
              <tr><th>ID</th><th>Name</th><th>Orders</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {emps.map((e: any) => (
                <tr key={e.id} className="border-t border-night-100">
                  <td className="py-2 font-mono">{e.emp_code}</td>
                  <td>{e.name}</td>
                  <td>{e.orders}</td>
                  <td className="font-semibold">{formatGhs(e.revenue_kobo)}</td>
                </tr>
              ))}
              {emps.length === 0 && <tr><td colSpan={4} className="py-3 text-night-500">No employee sales yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Top customers</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-night-500">
              <tr><th>Name</th><th>Phone</th><th>Orders</th><th>Spend</th></tr>
            </thead>
            <tbody>
              {custs.map((c: any) => (
                <tr key={c.id} className="border-t border-night-100">
                  <td className="py-2">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.orders}</td>
                  <td className="font-semibold">{formatGhs(c.spend_kobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Campaign performance</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-night-500">
            <tr><th>Code</th><th>Name</th><th>Usage</th><th>Total discount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {camps.map((c: any) => (
              <tr key={c.id} className="border-t border-night-100">
                <td className="py-2 font-mono font-bold text-flame">{c.code}</td>
                <td>{c.name}</td>
                <td>{c.usage_count}</td>
                <td>{formatGhs(c.discount_kobo)}</td>
                <td>{c.is_active ? <span className="badge bg-green-100 text-green-700">On</span> : <span className="badge bg-night-100">Off</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
