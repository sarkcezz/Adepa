import { useAuth } from '@/hooks/useAuth'

type Position = 'cashier' | 'stand_lead' | 'supervisor' | 'manager'

const POSITION_RANK: Record<Position, number> = {
  cashier:    1,
  stand_lead: 2,
  supervisor: 3,
  manager:    4,
}

const ABILITY_MIN: Record<string, Position> = {
  sell:             'cashier',
  apply_discount:   'stand_lead',
  hold_cart:        'stand_lead',
  void_sale:        'supervisor',
  refund_sale:      'supervisor',
  view_all_sales:   'manager',
}

/**
 * Permission helper for frontend. Mirrors the User::can() server-side
 * logic so we can hide UI controls the user can't actually use, without
 * losing the server-side enforcement (which is the real gate).
 *
 * Admins always pass.
 */
export function usePermission(ability: string): boolean {
  const { user } = useAuth()
  if (!user) return false
  if (user.role === 'admin') return true
  // Above we returned early for admin; below user.role is 'customer' or 'employee'.

  if (user.role !== 'employee') return false

  const min = ABILITY_MIN[ability]
  if (!min) return false

  const userRank = POSITION_RANK[(user.position as Position) || 'cashier'] || 0
  const minRank  = POSITION_RANK[min]
  return userRank >= minRank
}
