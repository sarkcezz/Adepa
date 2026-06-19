"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart, cartSubtotal, useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPage() {
  const mounted = useHasMounted();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = cartSubtotal(items);

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto grid w-full max-w-5xl place-items-center px-4 py-24 text-center sm:px-6">
        <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
          <ShoppingBag className="size-7" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-muted-foreground">Add a few cuts and they&apos;ll show up here.</p>
        <Button className="mt-6 rounded-full" size="lg" render={<Link href="/menu" />}>
          Browse the menu <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">Your cart</h1>
      <p className="mt-1 text-muted-foreground">
        {items.length} item{items.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Line items */}
        <ul className="space-y-3">
          {items.map(({ product, quantity }) => {
            return (
              <li
                key={product.id}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card p-3 sm:p-4"
              >
                <Link
                  href={`/menu/${product.id}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary/50 sm:size-24"
                >
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center font-[family-name:var(--font-display)] text-xs font-bold text-primary/30">
                      Adepa
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/menu/${product.id}`} className="font-semibold leading-tight hover:text-primary">
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {PRODUCT_LINE_LABEL[product.product_line]}
                        {product.weight_grams ? ` · ${formatWeight(product.weight_grams)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(product.id)}
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-full border border-border bg-background">
                      <button
                        onClick={() => setQty(product.id, quantity - 1)}
                        className="grid size-8 place-items-center rounded-full transition-colors hover:bg-secondary"
                        aria-label="Decrease"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                      <button
                        onClick={() => setQty(product.id, quantity + 1)}
                        className="grid size-8 place-items-center rounded-full transition-colors hover:bg-secondary"
                        aria-label="Increase"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums">
                      {formatGhs(product.price_kobo * quantity)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatGhs(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-muted-foreground">Calculated at checkout</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-4">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary tabular-nums">
                {formatGhs(subtotal)}
              </span>
            </div>
            <Button className="mt-5 w-full rounded-full" size="lg" render={<Link href="/checkout" />}>
              Checkout <ArrowRight className="size-4" />
            </Button>
            <Button variant="ghost" className="mt-2 w-full rounded-full" render={<Link href="/menu" />}>
              Continue shopping
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
