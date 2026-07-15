import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { siteUrl } from "@/lib/site";
import { RECIPES } from "@/lib/recipes-data";

const STATIC_ROUTES = [
  "", "/menu", "/stands", "/events", "/privacy", "/terms",
  "/about", "/why-our-pork", "/wholesale", "/promotions", "/faqs", "/contact",
  "/reviews", "/recipes", "/blog",
  "/refund-policy", "/shipping-policy", "/food-safety",
  "/pork-chops", "/pork-belly",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const recipeEntries: MetadataRoute.Sitemap = RECIPES.map((r) => ({
    url: `${base}/recipes/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await db
      .select({ slug: blogPosts.slug, updated_at: blogPosts.updated_at })
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true));
    blogEntries = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // sitemap generation shouldn't fail the build if the DB is unreachable
  }

  return [...staticEntries, ...recipeEntries, ...blogEntries];
}
