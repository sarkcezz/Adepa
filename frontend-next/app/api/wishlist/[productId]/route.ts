export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** DELETE /wishlist/:productId — remove a product from the wishlist. */
export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { productId } = await params;

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.user_id, user.id), eq(wishlists.product_id, productId)));

  return json({ ok: true });
}
