import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof campaigns.$inferInsert;
const SIMPLE: (keyof Input)[] = [
  "name", "discount_type", "discount_value", "min_order_kobo", "max_usage", "applicable_lines", "is_active",
];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<Partial<Input>>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };
  for (const f of SIMPLE) if (f in b) patch[f] = b[f];
  if (b.code) patch.code = b.code.toString().toUpperCase().trim();
  if (b.valid_from) patch.valid_from = new Date(b.valid_from as unknown as string);
  if (b.valid_to) patch.valid_to = new Date(b.valid_to as unknown as string);

  const [row] = await db.update(campaigns).set(patch).where(eq(campaigns.id, id)).returning();
  if (!row) return fail("Campaign not found.", 404);

  await audit(admin, "campaign.update", { subject_type: "Campaign", subject_id: id, subject_label: row.code });
  return json(row);
}
