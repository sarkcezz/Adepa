"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";
import { StarRating, StarPicker } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  verified: boolean;
  user_name: string;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user, token } = useAuth();
  const [data, setData] = useState<{ data: Review[]; average: number; count: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api<{ data: Review[]; average: number; count: number }>(`/products/${productId}/reviews`)
      .then(setData)
      .catch(() => setData({ data: [], average: 0, count: 0 }));
  }
  useEffect(load, [productId]);

  async function submit() {
    if (rating < 1) return toast.error("Pick a star rating first.");
    setSubmitting(true);
    try {
      await api(`/products/${productId}/reviews`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ rating, comment }),
      });
      toast.success("Thanks for your review!");
      setRating(0);
      setComment("");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14 border-t border-border/60 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Customer reviews</h2>
        {data && data.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={data.average} />
            <span className="text-sm text-muted-foreground">
              {data.average.toFixed(1)} · {data.count} review{data.count === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        {token ? (
          <div className="space-y-3">
            <StarPicker value={rating} onChange={setRating} />
            <Textarea
              placeholder="Share what you thought (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button size="sm" className="rounded-full" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href={`/login?next=/menu/${productId}`} className="font-semibold text-primary hover:underline">Sign in</Link>{" "}
            to leave a review.
          </p>
        )}
      </div>

      {/* List */}
      <div className="mt-6 space-y-4">
        {data === null ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
        ) : (
          data.data.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size="size-3.5" />
                  <span className="text-sm font-semibold">{r.user_name}</span>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <BadgeCheck className="size-3" /> Verified buyer
                    </span>
                  )}
                  {user?.name === r.user_name && (
                    <span className="text-[10px] font-medium text-muted-foreground">(your review)</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
