export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return fail("Product not found.", 404);
  return json(product);
}