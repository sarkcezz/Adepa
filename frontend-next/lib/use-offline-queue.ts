import { useCallback, useEffect, useState } from "react";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import type { SalePayload } from "@/lib/pos-types";

/**
 * IndexedDB-backed queue for sales submitted while offline (or that fail on a
 * network blip). Each entry holds the exact POST payload plus a
 * `client_reference` UUID the backend uses for idempotency, so replays after
 * reconnect can never duplicate a sale.
 */
export interface PendingSale {
  id: string; // client_reference (UUID)
  payload: SalePayload;
  status: "pending" | "syncing" | "failed";
  created_at: number;
  retries: number;
  last_error?: string;
}

interface QueueSchema extends DBSchema {
  sales: { key: string; value: PendingSale; indexes: { "by-status": string } };
}

let dbPromise: Promise<IDBPDatabase<QueueSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<QueueSchema>("adepa-pos", 1, {
      upgrade(db) {
        const store = db.createObjectStore("sales", { keyPath: "id" });
        store.createIndex("by-status", "status");
      },
    });
  }
  return dbPromise;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "r-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useOfflineQueue(token: string | null) {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState<PendingSale[]>([]);

  const refresh = useCallback(async () => {
    const db = await getDb();
    const all = await db.getAll("sales");
    setPending(all.sort((a, b) => b.created_at - a.created_at));
  }, []);

  /** Persist a sale to the queue. Returns the client_reference used. */
  const enqueue = useCallback(
    async (payload: SalePayload): Promise<string> => {
      const db = await getDb();
      // Reuse an existing client_reference if the caller already generated one
      // (e.g. an online POST that failed on the response) so replays dedupe.
      const id = payload.client_reference ?? uuid();
      const entry: PendingSale = {
        id,
        payload: { ...payload, client_reference: id },
        status: "pending",
        created_at: Date.now(),
        retries: 0,
      };
      await db.put("sales", entry);
      await refresh();
      return id;
    },
    [refresh],
  );

  /** Try to flush pending sales to the server. Returns count synced. */
  const flush = useCallback(async (): Promise<number> => {
    if (!token) return 0;
    const db = await getDb();
    const all = await db.getAll("sales");
    const items = all.filter((s) => s.status !== "syncing");

    let synced = 0;
    for (const item of items) {
      try {
        await db.put("sales", { ...item, status: "syncing" });
        const res = await fetch(`${API_BASE}/orders/employee-sale`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await db.delete("sales", item.id);
        synced++;
      } catch (e) {
        await db.put("sales", {
          ...item,
          status: "failed",
          retries: item.retries + 1,
          last_error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
    await refresh();
    return synced;
  }, [token, refresh]);

  /** Remove a queue item manually (e.g. dismiss a permanently failed sale). */
  const remove = useCallback(
    async (id: string) => {
      const db = await getDb();
      await db.delete("sales", id);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
    const goOnline = async () => {
      setOnline(true);
      const count = await flush();
      if (count > 0) toast.success(`${count} offline sale${count > 1 ? "s" : ""} synced.`);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [flush, refresh]);

  return { online, pending, enqueue, flush, remove, refresh };
}
