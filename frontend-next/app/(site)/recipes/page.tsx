import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { RECIPES, RECIPE_CATEGORY_LABEL, type RecipeCategory } from "@/lib/recipes-data";

export const metadata: Metadata = {
  title: "Pork Recipes",
  description: "Pork recipes for breakfast, lunch, dinner, BBQ, traditional Ghanaian meals, and international dishes — built around Adepa's fresh pork cuts.",
};

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = (category as RecipeCategory | undefined) ?? "ALL";
  const categories = Object.keys(RECIPE_CATEGORY_LABEL) as RecipeCategory[];
  const filtered = activeCategory === "ALL" ? RECIPES : RECIPES.filter((r) => r.category === activeCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Recipes</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Cook it like Adepa
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Breakfast to BBQ, traditional Ghanaian favourites to international dishes — recipes built around
        our cuts.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/recipes"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeCategory === "ALL" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/recipes?category=${c}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
            }`}
          >
            {RECIPE_CATEGORY_LABEL[c]}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.slug}
            href={`/recipes/${r.slug}`}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{RECIPE_CATEGORY_LABEL[r.category]}</span>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold">{r.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{r.description}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {r.prepMinutes + r.cookMinutes} min</span>
              <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Serves {r.servings}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
