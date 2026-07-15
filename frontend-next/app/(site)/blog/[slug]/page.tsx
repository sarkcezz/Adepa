import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    return await api<Post>(`/blog/${slug}`, { next: { revalidate: 120 } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.title ?? "Post", description: post?.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to blog
      </Link>

      <span className="mt-6 block text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">{post.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{formatDate(post.published_at)} · {post.author_name}</p>

      {post.cover_image_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
        </div>
      )}

      <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/90">
        {post.body.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </div>
  );
}
