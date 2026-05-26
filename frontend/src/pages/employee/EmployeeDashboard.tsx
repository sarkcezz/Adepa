import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'
import { api } from '@/lib/axios'
import { MetricCard } from '@/components/admin/MetricCard'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { formatGhs } from '@/lib/formatters'

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/orders/my-sales/summary').then((r) => setSummary(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Hi {user?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-night-600">Here's your sales snapshot.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sales today"     value={summary?.today_count || 0} icon={ShoppingBag} accent="gold" />
        <MetricCard label="Revenue today"   value={formatGhs(summary?.today_total || 0)} icon={DollarSign} accent="flame" />
        <MetricCard label="This week"       value={formatGhs(summary?.week_total || 0)} icon={TrendingUp} accent="blue" />
        <MetricCard label="This month"      value={formatGhs(summary?.month_total || 0)} icon={TrendingUp} accent="green" />
      </div>

      <div className="card flex items-center justify-between bg-gradient-to-r from-gold/10 to-flame/10">
        <div>
          <p className="font-semibold">Quick action</p>
          <p className="text-sm text-night-600">Record an in-person or phone sale.</p>
        </div>
        <Link to="/employee/sale"><Button variant="primary"><PlusCircle className="h-4 w-4" /> Record sale</Button></Link>
      </div>
    </div>
  )
}
