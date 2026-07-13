"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Bell icon with unread badge; polls every minute. Renders nothing until signed in. */
export function NotificationBell() {
  const mounted = useHasMounted();
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [unread, setUnread] = useState(0);

  function load() {
    if (!token) return;
    api<{ data: Notification[]; unread_count: number }>("/notifications", { token })
      .then((r) => { setItems(r.data); setUnread(r.unread_count); })
      .catch(() => {});
  }

  useEffect(() => {
    if (!token) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!mounted || !token) return null;

  async function markRead(n: Notification) {
    if (n.is_read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? null);
    setUnread((u) => Math.max(0, u - 1));
    try { await api(`/notifications/${n.id}/read`, { method: "POST", token: token! }); } catch { /* best effort */ }
  }

  async function markAllRead() {
    setItems((prev) => prev?.map((x) => ({ ...x, is_read: true })) ?? null);
    setUnread(0);
    try { await api("/notifications/read-all", { method: "POST", token: token! }); } catch { /* best effort */ }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications" />
        }
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {items === null ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary",
                  !n.is_read && "bg-primary/5",
                )}
              >
                <span className="flex w-full items-center gap-1.5 font-semibold">
                  {!n.is_read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
