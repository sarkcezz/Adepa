"use client";

import { create } from "zustand";
import { api } from "./api";

interface WishlistState {
  ids: Set<string>;
  loaded: boolean;
  load: (token: string) => Promise<void>;
  toggle: (token: string, productId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Small, session-only cache of wishlisted product ids (not persisted — the
 * server is the source of truth, refetched on demand rather than kept in
 * sync across tabs/devices).
 */
export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,

  async load(token) {
    try {
      const res = await api<{ data: { product: { id: string } }[] }>("/wishlist", { token });
      set({ ids: new Set(res.data.map((r) => r.product.id)), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  async toggle(token, productId) {
    const had = get().ids.has(productId);
    set((s) => {
      const next = new Set(s.ids);
      if (had) next.delete(productId);
      else next.add(productId);
      return { ids: next };
    });
    try {
      if (had) await api(`/wishlist/${productId}`, { method: "DELETE", token });
      else await api("/wishlist", { method: "POST", token, body: JSON.stringify({ product_id: productId }) });
    } catch {
      set((s) => {
        const next = new Set(s.ids);
        if (had) next.add(productId);
        else next.delete(productId);
        return { ids: next };
      });
    }
  },

  reset: () => set({ ids: new Set(), loaded: false }),
}));
