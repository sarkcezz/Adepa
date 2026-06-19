"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Product, ProductLine } from "@/lib/types";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

const LINES: { value: ProductLine | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "RAW", label: "Raw cuts" },
  { value: "SPICED", label: "Spiced" },
  { value: "READY_TO_EAT", label: "Ready to eat" },
];

const SIZES: { value: string; label: string; test: (g: number) => boolean }[] = [
  { value: "ALL", label: "Any size", test: () => true },
  { value: "small", label: "≤ 500g", test: (g) => g <= 500 },
  { value: "medium", label: "500g–2kg", test: (g) => g > 500 && g <= 2000 },
  { value: "large", label: "> 2kg", test: (g) => g > 2000 },
];

export function MenuGrid({ products, initialLine = "ALL" }: { products: Product[]; initialLine?: string }) {
  const [line, setLine] = useState<string>(initialLine);
  const [size, setSize] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const sizeDef = SIZES.find((s) => s.value === size)!;
    return products.filter((p) => {
      if (line !== "ALL" && p.product_line !== line) return false;
      if (size !== "ALL" && !sizeDef.test(p.weight_grams ?? 0)) return false;
      return true;
    });
  }, [products, line, size]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
    );

  return (
    <div>
      {/* Filters — horizontal scroll on mobile, wrap on desktop */}
      <div className="mb-8 space-y-3 border-b border-border/60 pb-6">
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="hidden items-center gap-1.5 pr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline-flex">
            <SlidersHorizontal className="size-3.5" /> Line
          </span>
          {LINES.map((l) => (
            <button key={l.value} onClick={() => setLine(l.value)} className={chip(line === l.value)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="hidden pr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
            Size
          </span>
          {SIZES.map((s) => (
            <button key={s.value} onClick={() => setSize(s.value)} className={chip(size === s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No products match these filters.
        </p>
      )}
    </div>
  );
}
