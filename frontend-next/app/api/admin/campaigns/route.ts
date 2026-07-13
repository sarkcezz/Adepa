export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { body, json, paginate, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof campaigns.$inferInsert;

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.created_at));
  return json(paginate(rows));
}

export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<Partial<Input>>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.toString().trim()) errors.name = ["Name is required."];
  if (!b.code?.toString().trim()) errors.code = ["Code is required."];
  if (!b.discount_type) errors.discount_type = ["Discount type is required."];
  if (b.discount_value == null) errors.discount_value = ["Discount value is required."];
  if (!b.valid_from) errors.valid_from = ["Start date is required."];
  if (!b.valid_to) errors.valid_to = ["End date is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [row] = await db
    .insert(campaigns)
    .values({
      name: b.name!,
      code: b.code!.toString().toUpperCase().trim(),
      discount_type: b.discount_type!,
      discount_value: b.discount_value!,
      min_order_kobo: b.min_order_kobo ?? 0,
      max_usage: b.max_usage ?? null,
      valid_from: new Date(b.valid_from as unknown as string),
      valid_to: new Date(b.valid_to as unknown as string),
      applicable_lines: b.applicable_lines ?? null,
      is_active: b.is_active ?? true,
    })
    .returning();

  await audit(admin, "campaign.create", { subject_type: "Campaign", subject_id: row.id, subject_label: row.code });
  return json(row, 201);
}
