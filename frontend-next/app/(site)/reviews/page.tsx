import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { publicApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { StarRating } from "@/components/site/star-rating";

export const metadata: Metadata = {
  title: "Customer reviews",
  description: "What Adepa Pork Hub customers are saying — real ratings and testimonials.",
};

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  verified: boolean;
  user_name: string;
  product_id: string;
  product_name: string;
}

async function getReviews() {
  try {
    return await publicApi<{ data: Review[]; average: number; count: number }>("/reviews", 120);
  } catch {
    return { data: [], average: 0, count: 0 };
  }
}

export default async function ReviewsPage() {
  const { data, average, count } = await getReviews();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Customer reviews</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        What our customers say
      </h1>

      {count > 0 ? (
        <div className="mt-4 flex items-center gap-3">
          <StarRating value={average} size="size-5" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{average.toFixed(1)}</span> average from {count} review{count === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">No reviews yet — be the first to leave one on any product page.</p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {data.map((r) => (
          <div key={r.id} className="flex flex-col rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <StarRating value={r.rating} size="size-3.5" />
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            {r.comment && <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{r.comment}&rdquo;</p>}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                {r.user_name}
                {r.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <BadgeCheck className="size-3" /> Verified buyer
                  </span>
                )}
              </span>
              <Link href={`/menu/${r.product_id}`} className="font-medium text-muted-foreground hover:text-primary">
                {r.product_name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
