export const dynamic = "force-dynamic";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";

/** GET /blog — published posts, newest first. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      category: blogPosts.category,
      cover_image_url: blogPosts.cover_image_url,
      author_name: blogPosts.author_name,
      published_at: blogPosts.published_at,
    })
    .from(blogPosts)
    .where(category ? and(eq(blogPosts.is_published, true), eq(blogPosts.category, category)) : eq(blogPosts.is_published, true))
    .orderBy(desc(blogPosts.published_at));

  return json(paginate(rows));
}
