import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** POST /admin/events/:id/registrations/:regId/check-in — mark a registrant checked in. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; regId: string }> },
) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id, regId } = await params;

  const [row] = await db
    .update(eventRegistrations)
    .set({ checked_in: true, checked_in_at: new Date(), updated_at: new Date() })
    .where(and(eq(eventRegistrations.id, regId), eq(eventRegistrations.event_id, id)))
    .returning();
  if (!row) return fail("Registration not found.", 404);

  await audit(admin, "event.check_in", { subject_type: "EventRegistration", subject_id: regId });
  return json(row);
}
