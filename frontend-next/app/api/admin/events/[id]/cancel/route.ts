import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents, eventRegistrations } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";
import { notifyUser } from "@/app/api/_lib/notifications";

/** POST /admin/events/:id/cancel — mark an event cancelled, notify registrants. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [row] = await db
    .update(porkEvents)
    .set({ status: "CANCELLED", updated_at: new Date() })
    .where(eq(porkEvents.id, id))
    .returning();
  if (!row) return fail("Event not found.", 404);

  await audit(admin, "event.cancel", { subject_type: "PorkEvent", subject_id: id, subject_label: row.name });

  const registrants = await db
    .select({ customer_id: eventRegistrations.customer_id })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.event_id, id));
  for (const r of registrants) {
    void notifyUser(r.customer_id, {
      type: "event.cancelled",
      title: `${row.name} has been cancelled`,
      message: "We're sorry — this event was cancelled. If you paid, we'll be in touch about a refund.",
      email: true,
      sms: true,
    });
  }

  return json(row);
}
