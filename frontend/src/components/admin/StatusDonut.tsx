import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#F59E0B', '#3B82F6', '#D4920A', '#0EA5E9', '#10B981', '#EF4444']
const labelMap: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export function StatusDonut({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data || {}).map(([key, value]) => ({ name: labelMap[key] || key, value }))

  if (!rows.length) return <p className="text-center text-sm text-night-500">No orders yet.</p>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={rows} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {rows.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
