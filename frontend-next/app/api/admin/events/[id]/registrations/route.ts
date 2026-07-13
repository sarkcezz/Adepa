export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, users } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/events/:id/registrations — registrants for an event. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const rows = await db
    .select({
      id: eventRegistrations.id,
      payment_status: eventRegistrations.payment_status,
      checked_in: eventRegistrations.checked_in,
      checked_in_at: eventRegistrations.checked_in_at,
      created_at: eventRegistrations.created_at,
      customer_name: users.name,
      customer_phone: users.phone,
      customer_email: users.email,
    })
    .from(eventRegistrations)
    .innerJoin(users, eq(users.id, eventRegistrations.customer_id))
    .where(eq(eventRegistrations.event_id, id))
    .orderBy(desc(eventRegistrations.created_at));

  return json({ data: rows });
}
