"use client";

import { Pause, Play, Trash2, Package } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { HeldCart } from "@/lib/use-held-carts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carts: HeldCart[];
  onResume: (id: string) => void;
  onDiscard: (id: string) => void;
}

const timeAgo = (ms: number) => {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
};

export function HeldCartsDrawer({ open, onOpenChange, carts, onResume, onDiscard }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pause className="size-4 text-primary" /> Held carts
          </SheetTitle>
          <SheetDescription>
            Paused orders. They stay here for 24 hours, then clear automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {carts.length === 0 ? (
            <div className="grid h-40 place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Package className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                No held carts.
              </div>
            </div>
          ) : (
            carts.map((c) => {
              const count = c.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {count} item{count !== 1 ? "s" : ""} · {c.payment_method} · {timeAgo(c.held_at)}
                    </p>
                  </div>
                  <Button size="sm" className="h-8 rounded-full" onClick={() => onResume(c.id)}>
                    <Play className="size-3.5" /> Resume
                  </Button>
                  <button
                    onClick={() => onDiscard(c.id)}
                    aria-label="Discard held cart"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
