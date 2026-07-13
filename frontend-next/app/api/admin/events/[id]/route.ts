import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof porkEvents.$inferInsert;
const FIELDS: (keyof Input)[] = [
  "name", "event_date", "event_time", "venue_name", "venue_address",
  "flat_rate_kobo", "capacity", "description", "image_url", "status",
];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<Partial<Input>>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };
  for (const f of FIELDS) if (f in b) patch[f] = b[f];

  const [row] = await db.update(porkEvents).set(patch).where(eq(porkEvents.id, id)).returning();
  if (!row) return fail("Event not found.", 404);

  await audit(admin, "event.update", { subject_type: "PorkEvent", subject_id: id, subject_label: row.name });
  return json(row);
}
