import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, porkEvents } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/**
 * POST /admin/events/:id/registrations/bulk — act on several registrations at once.
 *
 * Deleting is done here rather than as N separate requests because each
 * booking holds `1 + companions` spots: the event's registered_count has to
 * come down by the sum of those party sizes in one go, or a partial failure
 * leaves the capacity wrong.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ action?: "delete" | "check-in"; ids?: string[] }>(req);
  const ids = Array.isArray(b.ids) ? b.ids.filter((x) => typeof x === "string" && x) : [];
  if (!ids.length) return fail("Select at least one registrant.", 422);
  if (b.action !== "delete" && b.action !== "check-in") return fail("Unknown action.", 422);

  // Scope to this event so ids from elsewhere can't be swept in.
  const rows = await db
    .select({ id: eventRegistrations.id, companions: eventRegistrations.companions })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.event_id, id), inArray(eventRegistrations.id, ids)));
  if (!rows.length) return fail("No matching registrants found.", 404);

  const matched = rows.map((r) => r.id);

  if (b.action === "check-in") {
    await db
      .update(eventRegistrations)
      .set({
        checked_in: true,
        checked_in_at: new Date(),
        updated_at: new Date(),
        // Check-in is when cash at the door is collected, same as the single-row route.
        payment_status: sql`CASE WHEN ${eventRegistrations.payment_status} = 'PENDING' THEN 'PAID' ELSE ${eventRegistrations.payment_status} END`,
      })
      .where(inArray(eventRegistrations.id, matched));

    await audit(admin, "event.registrant.bulk_check_in", {
      subject_type: "PorkEvent", subject_id: id, note: `Checked in ${matched.length} registrant(s)`,
    });
    return json({ checked_in: matched.length });
  }

  const spotsFreed = rows.reduce((sum, r) => sum + 1 + (Array.isArray(r.companions) ? r.companions.length : 0), 0);

  await db.delete(eventRegistrations).where(inArray(eventRegistrations.id, matched));
  await db
    .update(porkEvents)
    .set({ registered_count: sql`GREATEST(${porkEvents.registered_count} - ${spotsFreed}, 0)` })
    .where(eq(porkEvents.id, id));

  await audit(admin, "event.registrant.bulk_delete", {
    subject_type: "PorkEvent", subject_id: id,
    note: `Removed ${matched.length} registrant(s), freeing ${spotsFreed} spot(s)`,
  });
  return json({ deleted: matched.length, spots_freed: spotsFreed });
}
