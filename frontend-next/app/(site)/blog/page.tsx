import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { publicApi } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog",
  description: "Healthy eating, cooking tips, nutrition, meat storage, food safety, and events from Adepa Pork Hub.",
};

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
}

async function getPosts() {
  try {
    return (await publicApi<{ data: Post[] }>("/blog", 120)).data;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Blog</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Notes from the butchery
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Healthy eating, cooking tips, nutrition, storage, food safety, and what's happening at Adepa.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/30"
            >
              {p.cover_image_url && (
                <div className="relative aspect-[16/9]">
                  <Image src={p.cover_image_url} alt={p.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category}</span>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                <p className="mt-4 text-xs text-muted-foreground">{formatDate(p.published_at)} · {p.author_name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
