export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { body, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /addresses — the customer's saved addresses. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.user_id, user.id))
    .orderBy(desc(addresses.is_default), desc(addresses.created_at));

  return json({ data: rows });
}

/** POST /addresses — add an address. */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{
    recipient?: string; phone?: string; area?: string; district?: string;
    label?: string; landmark?: string; is_default?: boolean;
  }>(req);

  const errors: Record<string, string[]> = {};
  if (!b.recipient?.trim()) errors.recipient = ["Recipient is required."];
  if (!b.phone?.trim()) errors.phone = ["Phone is required."];
  if (!b.area?.trim()) errors.area = ["Area is required."];
  if (!b.district?.trim()) errors.district = ["District is required."];
  if (Object.keys(errors).length) return validationError(errors);

  if (b.is_default) {
    await db.update(addresses).set({ is_default: false }).where(eq(addresses.user_id, user.id));
  }

  const [address] = await db
    .insert(addresses)
    .values({
      user_id: user.id,
      recipient: b.recipient!.trim(),
      phone: b.phone!.trim(),
      area: b.area!.trim(),
      district: b.district!.trim(),
      label: b.label?.trim() || "Home",
      landmark: b.landmark?.trim() || null,
      is_default: !!b.is_default,
    })
    .returning();

  return json(address, 201);
}
