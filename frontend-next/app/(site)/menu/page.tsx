import type { Metadata } from "next";
import { publicApi } from "@/lib/api";
import type { Paginated, Product } from "@/lib/types";
import { MenuGrid } from "@/components/site/menu-grid";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse Adepa's full range — raw cuts, spiced packs, and ready-to-eat platters.",
};

async function getProducts(): Promise<Product[]> {
  try {
    const res = await publicApi<Paginated<Product>>("/products?active_only=1", 60);
    return res.data;
  } catch {
    return [];
  }
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ line?: string }>;
}) {
  const [products, params] = await Promise.all([getProducts(), searchParams]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <span className="eyebrow">Our menu</span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          Pick your flavour
        </h1>
        <p className="mt-2 text-muted-foreground">
          From butcher-clean raw cuts to fire-grilled ready-to-eat platters.
        </p>
      </header>

      <MenuGrid products={products} initialLine={params.line ?? "ALL"} />
    </div>
  );
}
