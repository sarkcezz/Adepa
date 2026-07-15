export const dynamic = "force-dynamic";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews, users, products } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";

/** GET /reviews — site-wide testimonials for the Customer Reviews page. */
export async function GET() {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      photos: reviews.photos,
      created_at: reviews.created_at,
      verified: sql<boolean>`${reviews.order_id} is not null`,
      user_name: users.name,
      product_id: products.id,
      product_name: products.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.user_id))
    .innerJoin(products, eq(products.id, reviews.product_id))
    .where(eq(reviews.is_approved, true))
    .orderBy(desc(reviews.rating), desc(reviews.created_at))
    .limit(50);

  const [summary] = await db
    .select({
      average: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(eq(reviews.is_approved, true));

  return json({
    ...paginate(rows),
    average: Number(summary?.average ?? 0),
    count: Number(summary?.count ?? 0),
  });
}
