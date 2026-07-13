"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { formatGhs } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  /** Gross line value (unit price × qty), in pesewas. */
  lineGrossKobo: number;
  /** Current discount for the line, in pesewas. */
  currentKobo: number;
  onApply: (discountKobo: number) => void;
}

type Mode = "amount" | "percent";

/** Set a per-line discount as either a cedi amount or a percentage of the line. */
export function LineDiscountDialog({
  open,
  onOpenChange,
  productName,
  lineGrossKobo,
  currentKobo,
  onApply,
}: Props) {
  // The parent only mounts this component while the dialog is open (a fresh
  // instance per product), so initial state can read straight from props —
  // no reset-on-open effect needed.
  const [mode, setMode] = useState<Mode>("amount");
  const [value, setValue] = useState(currentKobo > 0 ? (currentKobo / 100).toString() : "");

  const discountKobo = useMemo(() => {
    const n = parseFloat(value);
    if (!isFinite(n) || n <= 0) return 0;
    const raw = mode === "amount" ? Math.round(n * 100) : Math.round((lineGrossKobo * n) / 100);
    return Math.max(0, Math.min(lineGrossKobo, raw));
  }, [value, mode, lineGrossKobo]);

  const newLine = lineGrossKobo - discountKobo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-4 text-primary" /> Line discount
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-secondary/40 p-3 text-sm">
            <p className="font-semibold">{productName}</p>
            <p className="text-muted-foreground">Line total {formatGhs(lineGrossKobo)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["amount", "percent"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-xl py-2 text-sm font-semibold transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
                )}
              >
                {m === "amount" ? "GHS off" : "% off"}
              </button>
            ))}
          </div>

          <Input
            autoFocus
            inputMode="decimal"
            placeholder={mode === "amount" ? "Amount in GHS" : "Percent (0–100)"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-semibold text-destructive tabular-nums">
              −{formatGhs(discountKobo)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">New total</span>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-primary tabular-nums">
              {formatGhs(newLine)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {currentKobo > 0 && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                onApply(0);
                onOpenChange(false);
              }}
            >
              Remove
            </Button>
          )}
          <Button
            onClick={() => {
              onApply(discountKobo);
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
