import { useCallback, useEffect, useState } from 'react'

/**
 * Cart "hold" feature. Lets an employee pause one customer's order and ring up
 * another (e.g. queue at a busy stand). Held carts persist in localStorage so
 * they survive an accidental refresh.
 */

export interface HeldCart {
  id: string
  name: string            // auto-generated: customer phone or timestamp
  items: { product_id: string; quantity: number; line_discount_kobo?: number }[]
  customer_phone?: string
  customer_name?: string
  promo_code?: string
  payment_method: 'CASH' | 'MOMO' | 'CARD'
  payment_reference?: string
  held_at: number
}

const STORAGE_KEY = 'adepa-pos-held-carts'

function readAll(): HeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(carts: HeldCart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carts))
}

export function useHeldCarts() {
  const [carts, setCarts] = useState<HeldCart[]>([])

  useEffect(() => {
    setCarts(readAll())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCarts(readAll())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Save a cart to the hold queue. Returns the generated ID. */
  const hold = useCallback((cart: Omit<HeldCart, 'id' | 'held_at' | 'name'> & { name?: string }) => {
    const id = `hc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const autoName = cart.customer_name
      || cart.customer_phone
      || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const entry: HeldCart = {
      id,
      name: cart.name || autoName,
      items: cart.items,
      customer_phone: cart.customer_phone,
      customer_name: cart.customer_name,
      promo_code: cart.promo_code,
      payment_method: cart.payment_method,
      payment_reference: cart.payment_reference,
      held_at: Date.now(),
    }
    const next = [...readAll(), entry]
    writeAll(next)
    setCarts(next)
    return id
  }, [])

  /** Resume a held cart — caller is responsible for populating their POS. */
  const resume = useCallback((id: string): HeldCart | null => {
    const cart = readAll().find((c) => c.id === id) || null
    if (cart) {
      const next = readAll().filter((c) => c.id !== id)
      writeAll(next)
      setCarts(next)
    }
    return cart
  }, [])

  /** Delete without resuming. */
  const discard = useCallback((id: string) => {
    const next = readAll().filter((c) => c.id !== id)
    writeAll(next)
    setCarts(next)
  }, [])

  return { carts, hold, resume, discard, count: carts.length }
}
