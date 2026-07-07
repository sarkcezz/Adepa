export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents } from "@/db/schema";
import { body, json, paginate, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof porkEvents.$inferInsert;

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const rows = await db.select().from(porkEvents).orderBy(desc(porkEvents.event_date));
  return json(paginate(rows));
}

export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<Partial<Input> & { is_published?: boolean }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.toString().trim()) errors.name = ["Name is required."];
  if (!b.event_date) errors.event_date = ["Event date is required."];
  if (!b.event_time) errors.event_time = ["Event time is required."];
  if (!b.venue_name?.toString().trim()) errors.venue_name = ["Venue is required."];
  if (b.flat_rate_kobo == null) errors.flat_rate_kobo = ["Ticket price is required."];
  if (b.capacity == null) errors.capacity = ["Capacity is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [row] = await db
    .insert(porkEvents)
    .values({
      name: b.name!,
      event_date: b.event_date!,
      event_time: b.event_time!,
      venue_name: b.venue_name!,
      venue_address: b.venue_address ?? "",
      flat_rate_kobo: b.flat_rate_kobo!,
      capacity: b.capacity!,
      description: b.description ?? "",
      image_url: b.image_url ?? null,
      status: b.status ?? (b.is_published ? "PUBLISHED" : "DRAFT"),
      created_by: admin.id,
    })
    .returning();

  await audit(admin, "event.create", { subject_type: "PorkEvent", subject_id: row.id, subject_label: row.name });
  return json(row, 201);
}
