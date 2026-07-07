import { NextResponse } from "next/server";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** PATCH /admin/products/:id/toggle — flip active state. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [product] = await db
    .update(products)
    .set({ is_active: not(products.is_active), updated_at: new Date() })
    .where(eq(products.id, id))
    .returning();
  if (!product) return fail("Product not found.", 404);

  await audit(admin, "product.toggle", {
    subject_type: "Product", subject_id: id, subject_label: product.name,
    note: product.is_active ? "Activated" : "Deactivated",
  });
  return json(product);
}
