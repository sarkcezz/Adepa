"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/format";

/** Compact +Add button used on product cards. Stops the parent link nav. */
export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const out = product.stock_qty === 0;

  return (
    <button
      type="button"
      disabled={out}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add(product);
        toast.success(`${product.name} added to cart`);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      aria-label={`Add ${product.name} to cart`}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-all hover:bg-primary active:scale-95 disabled:opacity-40"
    >
      {done ? <Check className="size-4" /> : <Plus className="size-4" />}
    </button>
  );
}

/** Full quantity + add control for the product detail page. */
export function ProductBuyBox({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const out = product.stock_qty === 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <Button
        size="lg"
        disabled={out}
        className="flex-1 rounded-full"
        onClick={() => {
          add(product, qty);
          toast.success(`${product.name} × ${qty} added to cart`);
        }}
      >
        <ShoppingBag className="size-4" />
        {out ? "Out of stock" : `Add to cart · ${formatGhs(product.price_kobo * qty)}`}
      </Button>
    </div>
  );
}
