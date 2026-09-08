import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingSettings } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";
import { SHIPPING_SETTINGS_ID } from "@/app/api/_lib/shipping";

/** PUT /admin/shipping/settings — the default zone fee, free-weight allowance, and per-kg surcharge. */
export async function PUT(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<{ default_fee_kobo?: number; free_weight_grams?: number; surcharge_per_kg_kobo?: number }>(req);
  const errors: Record<string, string[]> = {};
  if (b.default_fee_kobo == null || b.default_fee_kobo < 0) errors.default_fee_kobo = ["Enter a valid default fee."];
  if (b.free_weight_grams == null || b.free_weight_grams < 0) errors.free_weight_grams = ["Enter a valid free-weight allowance."];
  if (b.surcharge_per_kg_kobo == null || b.surcharge_per_kg_kobo < 0) errors.surcharge_per_kg_kobo = ["Enter a valid surcharge."];
  if (Object.keys(errors).length) return validationError(errors);

  const [updated] = await db
    .update(shippingSettings)
    .set({
      default_fee_kobo: b.default_fee_kobo,
      free_weight_grams: b.free_weight_grams,
      surcharge_per_kg_kobo: b.surcharge_per_kg_kobo,
      updated_at: new Date(),
    })
    .where(eq(shippingSettings.id, SHIPPING_SETTINGS_ID))
    .returning();
  if (!updated) return fail("Shipping settings not found.", 404);

  await audit(admin, "shipping.settings.update", { subject_type: "ShippingSettings", subject_id: SHIPPING_SETTINGS_ID });
  return json(updated);
}
