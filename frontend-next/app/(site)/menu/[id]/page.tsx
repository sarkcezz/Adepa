import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Flame } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL } from "@/lib/format";
import { ProductBuyBox } from "@/components/site/add-to-cart";

async function getProduct(id: string): Promise<Product | null> {
  try {
    return await api<Product>(`/products/${id}`, { next: { revalidate: 60 } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/menu"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to menu
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-secondary/50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-primary/25">
                Adepa
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{PRODUCT_LINE_LABEL[product.product_line]}</span>
            {product.variant !== "NONE" && (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {product.variant.toLowerCase()}
              </span>
            )}
            {product.heat_level > 0 && (
              <span className="inline-flex items-center gap-0.5 text-accent">
                {Array.from({ length: product.heat_level }).map((_, i) => (
                  <Flame key={i} className="size-3.5" />
                ))}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
            {product.name}
          </h1>
          {product.weight_grams ? (
            <p className="mt-1 text-sm text-muted-foreground">{formatWeight(product.weight_grams)}</p>
          ) : null}

          <p className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold text-primary">
            {formatGhs(product.price_kobo)}
          </p>

          <p className="mt-5 leading-relaxed text-foreground/80">{product.description}</p>

          {(product.ingredients || product.storage_instructions) && (
            <dl className="mt-6 space-y-4 rounded-2xl bg-secondary/50 p-5 text-sm">
              {product.ingredients && (
                <div>
                  <dt className="font-semibold">Ingredients</dt>
                  <dd className="mt-0.5 text-muted-foreground">{product.ingredients}</dd>
                </div>
              )}
              {product.storage_instructions && (
                <div>
                  <dt className="font-semibold">Storage</dt>
                  <dd className="mt-0.5 text-muted-foreground">{product.storage_instructions}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-7">
            <ProductBuyBox product={product} />
          </div>

          {product.stock_qty > 0 && product.stock_qty < 5 && (
            <p className="mt-3 text-sm font-medium text-accent-foreground">
              Only {product.stock_qty} left — order soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
