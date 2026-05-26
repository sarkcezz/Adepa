import { Badge } from '@/components/ui/Badge'
import type { OrderStatus } from '@/types'
import { formatStatus } from '@/lib/formatters'

const map: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'danger' | 'gold'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'gold',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={map[status]}>{formatStatus(status)}</Badge>
}
