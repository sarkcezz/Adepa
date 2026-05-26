import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/axios'
import { MetricCard } from '@/components/admin/MetricCard'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { StatusDonut } from '@/components/admin/StatusDonut'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs, formatDate } from '@/lib/formatters'
import type { Order } from '@/types'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null)
  const [revenue, setRevenue] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/summary'),
      api.get('/admin/analytics/revenue?period=daily'),
      api.get('/admin/analytics/products'),
      api.get('/admin/orders?per_page=10'),
    ]).then(([s, r, p, o]) => {
      setSummary(s.data)
      setRevenue(r.data.data || [])
      setTopProducts(p.data.data || [])
      setRecentOrders(o.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-night-500">Live overview of Adepa Pork Hub.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Revenue (all-time)" value={formatGhs(summary?.total_revenue_kobo || 0)} icon={DollarSign} accent="flame" />
        <MetricCard label="Orders today"       value={summary?.orders_today || 0} icon={ShoppingBag} accent="gold" />
        <MetricCard label="Orders this month"  value={summary?.orders_this_month || 0} icon={TrendingUp} accent="blue" />
        <MetricCard label="Customers"          value={summary?.total_customers || 0} icon={Users} accent="green" />
        <MetricCard label="Active products"    value={summary?.active_products || 0} icon={Package} accent="gold" />
        <MetricCard label="Pending orders"     value={summary?.pending_orders || 0} icon={AlertTriangle} accent="flame" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Revenue (last 30 days)</h2>
          <RevenueChart data={revenue} />
        </div>
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Orders by status</h2>
          <StatusDonut data={summary?.orders_by_status || {}} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Top products</h2>
          <ul className="divide-y divide-night-100 text-sm">
            {topProducts.slice(0, 5).map((p, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>{i + 1}. {p.product_name}</span>
                <span className="font-semibold text-flame">{formatGhs(p.revenue_kobo)}</span>
              </li>
            ))}
            {topProducts.length === 0 && <li className="py-2 text-night-500">No sales yet.</li>}
          </ul>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-flame hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-night-100">
              {recentOrders.slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td className="py-2 font-mono text-xs">{o.order_number}</td>
                  <td className="text-night-500">{formatDate(o.created_at)}</td>
                  <td className="font-semibold">{formatGhs(o.total_kobo)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
