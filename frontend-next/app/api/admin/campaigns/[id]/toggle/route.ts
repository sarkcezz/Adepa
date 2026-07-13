import { NextResponse } from "next/server";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** PATCH /admin/campaigns/:id/toggle — flip active state. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [row] = await db
    .update(campaigns)
    .set({ is_active: not(campaigns.is_active), updated_at: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  if (!row) return fail("Campaign not found.", 404);

  await audit(admin, "campaign.toggle", {
    subject_type: "Campaign", subject_id: id, subject_label: row.code,
    note: row.is_active ? "Activated" : "Deactivated",
  });
  return json(row);
}
