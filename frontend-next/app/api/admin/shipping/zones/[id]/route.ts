import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** PUT /admin/shipping/zones/:id — edit a district's name and/or fee. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ district?: string; fee_kobo?: number }>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };

  if (b.district !== undefined) {
    const district = b.district.trim().toLowerCase();
    if (!district) return validationError({ district: ["District can't be empty."] });
    const [clash] = await db.select({ id: shippingZones.id }).from(shippingZones).where(and(eq(shippingZones.district, district), ne(shippingZones.id, id))).limit(1);
    if (clash) return fail("Another zone already uses that district.", 409);
    patch.district = district;
  }
  if (b.fee_kobo !== undefined) {
    if (b.fee_kobo < 0) return validationError({ fee_kobo: ["Enter a valid fee."] });
    patch.fee_kobo = b.fee_kobo;
  }

  const [zone] = await db.update(shippingZones).set(patch).where(eq(shippingZones.id, id)).returning();
  if (!zone) return fail("Zone not found.", 404);

  await audit(admin, "shipping.zone.update", { subject_type: "ShippingZone", subject_id: id, subject_label: zone.district });
  return json(zone);
}

/** DELETE /admin/shipping/zones/:id — remove a zone; that district falls back to the default fee. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [zone] = await db.delete(shippingZones).where(eq(shippingZones.id, id)).returning();
  if (!zone) return fail("Zone not found.", 404);

  await audit(admin, "shipping.zone.delete", { subject_type: "ShippingZone", subject_id: id, subject_label: zone.district });
  return json({ deleted: true });
}
