"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Product } from "./types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { product, quantity: qty }] };
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.product.id !== productId)
              : s.items.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
        })),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "adepa-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((n, i) => n + i.product.price_kobo * i.quantity, 0);

/**
 * Guards against hydration mismatch: the persisted cart only exists on the
 * client, so components that show cart-derived values should wait for mount.
 */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard: "has this mounted on the client" can only be known inside an effect.
  useEffect(() => setMounted(true), []);
  return mounted;
}
