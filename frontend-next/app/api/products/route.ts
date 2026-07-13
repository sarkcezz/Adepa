export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const activeOnly = ["1", "true"].includes(url.searchParams.get("active_only") ?? "");

  const rows = await db
    .select()
    .from(products)
    .where(activeOnly ? eq(products.is_active, true) : undefined)
    .orderBy(desc(products.created_at));

  return json(paginate(rows));
}