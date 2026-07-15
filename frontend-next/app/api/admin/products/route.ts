export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { body, json, paginate, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type ProductInput = typeof products.$inferInsert;

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const rows = await db.select().from(products).orderBy(desc(products.created_at));
  return json(paginate(rows));
}

export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<Partial<ProductInput>>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.toString().trim()) errors.name = ["Name is required."];
  if (!b.product_line) errors.product_line = ["Product line is required."];
  if (b.price_kobo == null) errors.price_kobo = ["Price is required."];
  if (!b.description?.toString().trim()) errors.description = ["Description is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [product] = await db
    .insert(products)
    .values({
      name: b.name!,
      product_line: b.product_line!,
      variant: b.variant ?? "NONE",
      weight_grams: b.weight_grams ?? null,
      price_kobo: b.price_kobo!,
      description: b.description!,
      ingredients: b.ingredients ?? null,
      storage_instructions: b.storage_instructions ?? null,
      heat_level: b.heat_level ?? 0,
      image_url: b.image_url ?? null,
      gallery_urls: b.gallery_urls ?? null,
      category: b.category ?? null,
      nutrition_info: b.nutrition_info ?? null,
      cooking_tips: b.cooking_tips ?? null,
      stock_qty: b.stock_qty ?? 0,
      is_active: b.is_active ?? true,
    })
    .returning();

  await audit(admin, "product.create", { subject_type: "Product", subject_id: product.id, subject_label: product.name });
  return json(product, 201);
}
