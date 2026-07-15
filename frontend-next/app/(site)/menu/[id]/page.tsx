import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Flame } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Product, Paginated } from "@/lib/types";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL, CATEGORY_LABEL, type ProductCategory } from "@/lib/format";
import { ProductBuyBox } from "@/components/site/add-to-cart";
import { WishlistButton } from "@/components/site/wishlist-button";
import { ProductReviews } from "@/components/site/product-reviews";
import { ProductGallery } from "@/components/site/product-gallery";
import { ProductCard } from "@/components/site/product-card";

async function getProduct(id: string): Promise<Product | null> {
  try {
    return await api<Product>(`/products/${id}`, { next: { revalidate: 60 } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

async function getRelated(product: Product): Promise<Product[]> {
  try {
    const res = await api<Paginated<Product>>("/products?active_only=1", { next: { revalidate: 60 } });
    const others = res.data.filter((p) => p.id !== product.id);
    const sameCategory = product.category ? others.filter((p) => p.category === product.category) : [];
    const pool = sameCategory.length >= 4 ? sameCategory : [...sameCategory, ...others.filter((p) => p.product_line === product.product_line && !sameCategory.includes(p))];
    return pool.slice(0, 4);
  } catch {
    return [];
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
  const related = await getRelated(product);

  const images = [product.image_url, ...(product.gallery_urls ?? [])].filter((u): u is string => !!u);

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
        <div className="relative">
          <ProductGallery name={product.name} images={images} />
          <WishlistButton productId={product.id} className="absolute right-4 top-4" />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{PRODUCT_LINE_LABEL[product.product_line]}</span>
            {product.category && (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABEL[product.category as ProductCategory] ?? product.category}
              </span>
            )}
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

          {(product.ingredients || product.storage_instructions || product.nutrition_info || product.cooking_tips) && (
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
              {product.cooking_tips && (
                <div>
                  <dt className="font-semibold">Cooking tips</dt>
                  <dd className="mt-0.5 text-muted-foreground">{product.cooking_tips}</dd>
                </div>
              )}
              {product.nutrition_info && (
                <div>
                  <dt className="font-semibold">Nutrition</dt>
                  <dd className="mt-0.5 text-muted-foreground">{product.nutrition_info}</dd>
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

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-14 border-t border-border/60 pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
