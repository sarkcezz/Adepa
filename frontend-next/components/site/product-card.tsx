import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product }: { product: Product }) {
  const out = product.stock_qty === 0;

  return (
    <Link
      href={`/menu/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary/30">
              Adepa
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {PRODUCT_LINE_LABEL[product.product_line]}
        </span>

        <WishlistButton productId={product.id} className="absolute right-3 top-3" />

        {product.heat_level > 0 && (
          <span className="absolute right-3 top-12 inline-flex items-center gap-0.5 rounded-full bg-accent px-2 py-1 text-accent-foreground">
            {Array.from({ length: product.heat_level }).map((_, i) => (
              <Flame key={i} className="size-3" />
            ))}
          </span>
        )}

        {out && (
          <span className="absolute inset-0 grid place-items-center bg-foreground/55 text-xs font-bold uppercase tracking-wider text-background">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatWeight(product.weight_grams) || product.variant.toLowerCase()}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary">
              {formatGhs(product.price_kobo)}
            </p>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </Link>
  );
}
