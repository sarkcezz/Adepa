import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** POST /admin/shipping/zones — add a district's delivery fee. */
export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<{ district?: string; fee_kobo?: number }>(req);
  const district = b.district?.trim().toLowerCase();
  const errors: Record<string, string[]> = {};
  if (!district) errors.district = ["District is required."];
  if (b.fee_kobo == null || b.fee_kobo < 0) errors.fee_kobo = ["Enter a valid fee."];
  if (Object.keys(errors).length) return validationError(errors);

  const [existing] = await db.select({ id: shippingZones.id }).from(shippingZones).where(eq(shippingZones.district, district!)).limit(1);
  if (existing) return fail("That district already has a zone fee — edit it instead.", 409);

  const [zone] = await db.insert(shippingZones).values({ district: district!, fee_kobo: b.fee_kobo! }).returning();

  await audit(admin, "shipping.zone.create", { subject_type: "ShippingZone", subject_id: zone.id, subject_label: zone.district });
  return json(zone, 201);
}
