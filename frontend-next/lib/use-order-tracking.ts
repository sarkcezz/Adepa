"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth-store";
import { isTerminal } from "./order";
import type { OrderStatus, StatusHistory } from "./types";

interface StatusResponse {
  id: string;
  status: OrderStatus;
  updated_at: string;
  history: StatusHistory[];
}

/**
 * Polls GET /orders/{id}/status every `intervalMs`. Stops on terminal status.
 *
 * Polling is the right call against the current Hostinger backend (no socket
 * runtime). Once the API moves to Cloud Run we can swap the body of this hook
 * for an EventSource without touching any consumer.
 */
export function useOrderTracking(orderId: string | undefined, intervalMs = 10000) {
  const token = useAuth((s) => s.token);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId || !token) return;
    let cancelled = false;

    async function tick() {
      try {
        const res = await api<StatusResponse>(`/orders/${orderId}/status`, { token: token! });
        if (cancelled) return;
        setStatus(res.status);
        setHistory(res.history || []);
        if (isTerminal(res.status) && timer.current) clearInterval(timer.current);
      } catch {
        /* keep last good state; next tick retries */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    tick();
    timer.current = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [orderId, token, intervalMs]);

  return { status, history, loading };
}
