import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/axios'
import type { OrderStatus, StatusHistory } from '@/types'

interface TrackingResult {
  status: OrderStatus | null
  history: StatusHistory[]
  loading: boolean
  error: string | null
}

const TERMINAL: OrderStatus[] = ['DELIVERED', 'CANCELLED']

export function useOrderTracking(orderId: string | undefined, intervalMs = 10000): TrackingResult {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!orderId) return

    let cancelled = false

    async function tick() {
      try {
        const res = await api.get(`/orders/${orderId}/status`)
        if (cancelled) return
        setStatus(res.data.status)
        setHistory(res.data.history || [])
        setError(null)
        if (TERMINAL.includes(res.data.status) && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e?.response?.data?.message || 'Could not refresh status.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, intervalMs)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderId, intervalMs])

  return { status, history, loading, error }
}
