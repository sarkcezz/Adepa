import { useCallback, useEffect, useState } from "react";
import type { PayMethod, SaleLine } from "@/lib/pos-types";

/**
 * Cart "hold" feature. Lets an employee pause one customer's order and ring up
 * another (e.g. a busy stand queue). Held carts persist in localStorage so they
 * survive an accidental refresh, and auto-expire after 24h.
 */
export interface HeldCart {
  id: string;
  name: string; // auto-generated: customer name/phone or timestamp
  items: SaleLine[];
  customer_phone?: string;
  customer_name?: string;
  payment_method: PayMethod;
  payment_reference?: string;
  stand_name?: string;
  held_at: number;
}

const STORAGE_KEY = "adepa-pos-held-carts";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function readAll(): HeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: HeldCart[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const fresh = all.filter((c) => now - c.held_at < EXPIRY_MS);
    if (fresh.length !== all.length) writeAll(fresh);
    return fresh;
  } catch {
    return [];
  }
}

function writeAll(carts: HeldCart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
}

export function useHeldCarts() {
  const [carts, setCarts] = useState<HeldCart[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of the client-only localStorage source, then subscribes below.
    setCarts(readAll());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCarts(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const hold = useCallback(
    (cart: Omit<HeldCart, "id" | "held_at" | "name"> & { name?: string }) => {
      const id = `hc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const autoName =
        cart.customer_name ||
        cart.customer_phone ||
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const entry: HeldCart = { ...cart, id, name: cart.name || autoName, held_at: Date.now() };
      const next = [...readAll(), entry];
      writeAll(next);
      setCarts(next);
      return id;
    },
    [],
  );

  const resume = useCallback((id: string): HeldCart | null => {
    const cart = readAll().find((c) => c.id === id) || null;
    if (cart) {
      const next = readAll().filter((c) => c.id !== id);
      writeAll(next);
      setCarts(next);
    }
    return cart;
  }, []);

  const discard = useCallback((id: string) => {
    const next = readAll().filter((c) => c.id !== id);
    writeAll(next);
    setCarts(next);
  }, []);

  return { carts, hold, resume, discard, count: carts.length };
}
