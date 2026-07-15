import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { getRecipeBySlug, RECIPE_CATEGORY_LABEL, RECIPES } from "@/lib/recipes-data";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  return { title: recipe?.title ?? "Recipe", description: recipe?.description };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to recipes
      </Link>

      <span className="mt-6 block text-xs font-semibold uppercase tracking-wider text-primary">{RECIPE_CATEGORY_LABEL[recipe.category]}</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">{recipe.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{recipe.description}</p>

      <div className="mt-5 flex items-center gap-6 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> Prep {recipe.prepMinutes} min · Cook {recipe.cookMinutes} min</span>
        <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> Serves {recipe.servings}</span>
      </div>

      {recipe.videoUrl && (
        <div className="mt-8 aspect-video overflow-hidden rounded-2xl border border-border/60">
          <iframe src={recipe.videoUrl} className="size-full" allowFullScreen title={`${recipe.title} video`} />
        </div>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_1.5fr]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Ingredients</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recipe.ingredients.map((ing) => (
              <li key={ing} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Method</h2>
          <ol className="mt-3 space-y-4 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <span className="leading-relaxed text-foreground/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-secondary/50 p-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold">Ready to cook this?</p>
        <Link href="/menu" className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Shop the cuts
        </Link>
      </div>
    </div>
  );
}
