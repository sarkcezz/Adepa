import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingSettings, shippingZones } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { SHIPPING_SETTINGS_ID } from "@/app/api/_lib/shipping";

/** GET /admin/shipping — the global delivery settings plus every district zone fee. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const [settings, zones] = await Promise.all([
    db.select().from(shippingSettings).where(eq(shippingSettings.id, SHIPPING_SETTINGS_ID)).limit(1),
    db.select().from(shippingZones).orderBy(asc(shippingZones.district)),
  ]);

  return json({ settings: settings[0] ?? null, zones });
}
