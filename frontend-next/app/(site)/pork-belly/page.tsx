import type { Metadata } from "next";
import { publicApi } from "@/lib/api";
import type { Paginated, Product } from "@/lib/types";
import { MenuGrid } from "@/components/site/menu-grid";

export const metadata: Metadata = {
  title: "Buy Pork Belly Online in Ghana",
  description: "Fresh pork belly, delivered across Kumasi or ready for pickup — rich, layered cuts for roasting, braising, or crackling.",
};

async function getProducts(): Promise<Product[]> {
  try {
    return (await publicApi<Paginated<Product>>("/products?active_only=1", 60)).data;
  } catch {
    return [];
  }
}

export default async function PorkBellyPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <span className="eyebrow">Pork Belly</span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          Fresh Pork Belly, Delivered
        </h1>
        <p className="mt-2 text-muted-foreground">
          Rich, layered pork belly from Symas Farms — perfect for crackling, braising, or a slow roast.
          Ordered online, delivered fast across Kumasi.
        </p>
      </header>

      <MenuGrid products={products} initialCategory="PORK_BELLY" />
    </div>
  );
}
