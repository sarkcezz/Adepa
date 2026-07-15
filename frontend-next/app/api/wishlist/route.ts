export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /wishlist — the customer's saved products. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select({ id: wishlists.id, created_at: wishlists.created_at, product: products })
    .from(wishlists)
    .innerJoin(products, eq(products.id, wishlists.product_id))
    .where(eq(wishlists.user_id, user.id))
    .orderBy(desc(wishlists.created_at));

  return json({ data: rows });
}

/** POST /wishlist { product_id } — add a product to the wishlist (idempotent). */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{ product_id?: string }>(req);
  if (!b.product_id) return validationError({ product_id: ["Product is required."] });

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, b.product_id)).limit(1);
  if (!product) return fail("Product not found.", 404);

  await db
    .insert(wishlists)
    .values({ user_id: user.id, product_id: b.product_id })
    .onConflictDoNothing();

  return json({ ok: true }, 201);
}
