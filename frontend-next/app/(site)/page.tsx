// Rendered at request time so same-origin /api is reachable (self-contained backend).
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Leaf, ChefHat, ShieldCheck } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { Paginated, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";

async function getFeatured(): Promise<Product[]> {
  try {
    const res = await publicApi<Paginated<Product>>("/products?active_only=1", 120);
    return res.data.slice(0, 4);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-foreground text-primary-foreground grain">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <span className="inline-block rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
              Premium Ghanaian pork
            </span>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Fresh from the farm.{" "}
              <span className="rounded-lg bg-accent px-2 text-accent-foreground">Fire-ready</span> for your table.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/90">
              Ethically raised, butcher-clean cuts and ready-to-eat platters,
              delivered same-day across Kumasi.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                render={<Link href="/menu" />}
              >
                Order now <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/stands" />}
              >
                Find a stand
              </Button>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {[
                ["24", "Pack sizes"],
                ["3", "Spice levels"],
                ["Same-day", "Delivery"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary-foreground sm:text-3xl">{v}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/75">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rotate-2 rounded-[2.5rem] bg-accent/15 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/15 bg-white/5">
              <Image
                src="/images/marinated.jpg"
                alt="Marinated pork skewers with peppers and onions on the grill"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Curated this week</span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Most-loved cuts
            </h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Menu is loading. Check back in a moment.
          </p>
        )}
      </section>

      {/* Value props */}
      <section className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            [Leaf, "Ethically raised", "Local Ghanaian farms, never factory-farmed"],
            [ShieldCheck, "Cold-chain sealed", "Vacuum packed, hygiene certified"],
            [ChefHat, "Hand-spiced", "Family recipes, mixed fresh, never pre-bottled"],
            [Truck, "Same-day delivery", "Kumasi, ordered before 3pm"],
          ].map(([Icon, title, desc]) => {
            const I = Icon as typeof Leaf;
            return (
              <div key={title as string} className="flex gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <I className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{title as string}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-8 py-14 text-background grain sm:px-14">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">Hungry yet?</h2>
              <p className="mt-2 max-w-md text-background/70">
                Get your first pack delivered today. No subscription, no hassle.
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              render={<Link href="/menu" />}
            >
              Browse the menu <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}