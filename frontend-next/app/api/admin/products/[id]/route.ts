import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type ProductInput = typeof products.$inferInsert;
const FIELDS: (keyof ProductInput)[] = [
  "name", "product_line", "variant", "weight_grams", "price_kobo", "description",
  "ingredients", "storage_instructions", "heat_level", "image_url", "gallery_urls",
  "category", "nutrition_info", "cooking_tips", "stock_qty", "is_active",
];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<Partial<ProductInput>>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };
  for (const f of FIELDS) if (f in b) patch[f] = b[f];

  const [product] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
  if (!product) return fail("Product not found.", 404);

  await audit(admin, "product.update", { subject_type: "Product", subject_id: id, subject_label: product.name });
  return json(product);
}
