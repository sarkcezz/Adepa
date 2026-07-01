"use client";

import { WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingSale } from "@/lib/use-offline-queue";

interface Props {
  online: boolean;
  pending: PendingSale[];
  onFlush: () => void;
}

/**
 * Shows connectivity state and any sales still waiting to sync. Hidden entirely
 * when online with nothing queued, so it stays out of the way during normal use.
 */
export function OfflineBanner({ online, pending, onFlush }: Props) {
  const count = pending.length;
  if (online && count === 0) return null;

  const failed = pending.some((p) => p.status === "failed");

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ring-1",
        !online
          ? "bg-accent/10 text-accent-foreground ring-accent/30"
          : failed
            ? "bg-destructive/10 text-destructive ring-destructive/30"
            : "bg-primary/10 text-primary ring-primary/25",
      )}
    >
      {!online ? (
        <>
          <WifiOff className="size-4 shrink-0" />
          <span>Offline — sales are saved and will sync automatically when you reconnect.</span>
        </>
      ) : (
        <>
          <CloudUpload className="size-4 shrink-0" />
          <span className="flex-1">
            {count} sale{count !== 1 ? "s" : ""} waiting to sync
            {failed ? " (some failed)" : ""}.
          </span>
          <button
            onClick={onFlush}
            className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 font-semibold hover:bg-background"
          >
            <RefreshCw className="size-3" /> Sync now
          </button>
        </>
      )}
      {!online && count > 0 && (
        <span className="ml-auto shrink-0 rounded-full bg-background/60 px-2 py-0.5">{count} queued</span>
      )}
    </div>
  );
}
