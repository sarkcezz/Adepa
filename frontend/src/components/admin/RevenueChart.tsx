import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatGhs } from '@/lib/formatters'

interface Row { label: string; revenue_kobo: number; order_count: number }

export function RevenueChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 100)}`} />
        <Tooltip
          formatter={(value: number) => formatGhs(value)}
          labelClassName="text-xs"
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E5', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="revenue_kobo" stroke="#C0281A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
