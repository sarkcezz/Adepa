export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews, users, orders, orderItems } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /products/:id/reviews — approved reviews + average rating for a product. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [rows, [summary]] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        photos: reviews.photos,
        created_at: reviews.created_at,
        verified: sql<boolean>`${reviews.order_id} is not null`,
        user_name: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.user_id))
      .where(and(eq(reviews.product_id, id), eq(reviews.is_approved, true)))
      .orderBy(desc(reviews.created_at)),
    db
      .select({
        average: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.product_id, id), eq(reviews.is_approved, true))),
  ]);

  return json({
    data: rows,
    average: Number(summary?.average ?? 0),
    count: Number(summary?.count ?? 0),
  });
}

/** POST /products/:id/reviews { rating, comment } — create or update the caller's review. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req, ["customer"]);
  if (user instanceof NextResponse) return user;
  const { id: productId } = await params;

  const b = await body<{ rating?: number; comment?: string }>(req);
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return validationError({ rating: ["Rating must be between 1 and 5."] });
  }

  // Verified-purchase badge: does this customer have a paid order containing this product?
  const [purchase] = await db
    .select({ order_id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.order_id, orders.id))
    .where(and(
      eq(orders.customer_id, user.id),
      eq(orders.payment_status, "PAID"),
      eq(orderItems.product_id, productId),
    ))
    .limit(1);

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.product_id, productId), eq(reviews.user_id, user.id)))
    .limit(1);

  const values = {
    rating,
    comment: b.comment?.trim() || null,
    order_id: purchase?.order_id ?? null,
  };

  const [review] = existing
    ? await db.update(reviews).set(values).where(eq(reviews.id, existing.id)).returning()
    : await db.insert(reviews).values({ product_id: productId, user_id: user.id, ...values }).returning();

  if (!review) return fail("Could not save review.", 500);
  return json(review, existing ? 200 : 201);
}
