"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/components/site/add-to-cart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface WishlistRow {
  id: string;
  product: Product;
}

export default function WishlistPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<WishlistRow[] | null>(null);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/wishlist");
  }, [mounted, token, router]);

  useEffect(() => {
    if (!token) return;
    api<{ data: WishlistRow[] }>("/wishlist", { token })
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [token]);

  async function remove(productId: string) {
    setItems((p) => p?.filter((r) => r.product.id !== productId) ?? null);
    try {
      await api(`/wishlist/${productId}`, { method: "DELETE", token: token! });
    } catch {
      toast.error("Could not remove item.");
    }
  }

  if (!mounted || !token) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold">Wishlist</h1>

      <div className="mt-8 space-y-3">
        {items === null ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Heart className="size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Nothing saved yet.</p>
            <Button className="mt-4 rounded-full" render={<Link href="/menu" />}>Browse menu</Button>
          </div>
        ) : (
          items.map(({ product }) => (
            <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
              <Link href={`/menu/${product.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary/50">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill sizes="64px" className="object-cover" />
                ) : null}
              </Link>
              <Link href={`/menu/${product.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatGhs(product.price_kobo)}</p>
              </Link>
              <AddToCartButton product={product} />
              <button
                onClick={() => remove(product.id)}
                aria-label="Remove from wishlist"
                className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
