import { useCallback, useEffect, useState } from 'react'
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

/**
 * IndexedDB-backed queue for sales submitted while offline.
 * Each entry holds the exact POST payload and a client_reference key the
 * backend uses for idempotency, so replays after reconnect can't duplicate.
 */

interface PendingSale {
  id: string                   // client_reference (UUID)
  payload: any                 // employee-sale POST body
  status: 'pending' | 'syncing' | 'failed'
  created_at: number
  retries: number
  last_error?: string
}

interface QueueSchema extends DBSchema {
  sales: {
    key: string
    value: PendingSale
    indexes: { 'by-status': string }
  }
}

let dbPromise: Promise<IDBPDatabase<QueueSchema>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<QueueSchema>('adepa-pos', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sales', { keyPath: 'id' })
        store.createIndex('by-status', 'status')
      },
    })
  }
  return dbPromise
}

/** Stable UUID generator that works in non-secure contexts as a fallback. */
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'r-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useOfflineQueue() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState<PendingSale[]>([])

  const refresh = useCallback(async () => {
    const db = await getDb()
    const all = await db.getAll('sales')
    setPending(all.sort((a, b) => b.created_at - a.created_at))
  }, [])

  /** Enqueue a new sale (called when offline OR when we want resilience). */
  const enqueue = useCallback(async (payload: any): Promise<string> => {
    const db = await getDb()
    const id = uuid()
    const entry: PendingSale = {
      id,
      payload: { ...payload, client_reference: id },
      status: 'pending',
      created_at: Date.now(),
      retries: 0,
    }
    await db.put('sales', entry)
    await refresh()
    return id
  }, [refresh])

  /** Try to flush pending sales to the server. Returns count synced. */
  const flush = useCallback(async (): Promise<number> => {
    const db = await getDb()
    const all = await db.getAll('sales')
    const pendingItems = all.filter((s) => s.status !== 'syncing')

    let synced = 0
    for (const item of pendingItems) {
      try {
        // Mark syncing so concurrent flushes don't double-submit
        await db.put('sales', { ...item, status: 'syncing' })
        await api.post('/orders/employee-sale', item.payload)
        await db.delete('sales', item.id)
        synced++
      } catch (e: any) {
        await db.put('sales', {
          ...item,
          status: 'failed',
          retries: item.retries + 1,
          last_error: e?.response?.data?.message || e?.message || 'Unknown error',
        })
      }
    }

    await refresh()
    return synced
  }, [refresh])

  /** Remove a queue item manually (e.g. after user dismisses a failed sale). */
  const remove = useCallback(async (id: string) => {
    const db = await getDb()
    await db.delete('sales', id)
    await refresh()
  }, [refresh])

  // React to online/offline transitions
  useEffect(() => {
    refresh()
    const goOnline = async () => {
      setOnline(true)
      const count = await flush()
      if (count > 0) toast.success(`${count} offline sale${count > 1 ? 's' : ''} synced.`)
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [flush, refresh])

  return { online, pending, enqueue, flush, remove, refresh }
}
