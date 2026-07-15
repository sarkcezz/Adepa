export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";

/** GET /blog/:slug — a single published post. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.is_published, true)))
    .limit(1);
  if (!post) return fail("Post not found.", 404);
  return json(post);
}
