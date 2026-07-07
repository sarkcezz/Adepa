import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** POST /admin/events/:id/cancel — mark an event cancelled. */
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
  // TODO(phase-7): notify registered customers of the cancellation.
  return json(row);
}
