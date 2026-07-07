export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { standAnnouncements } from "@/db/schema";
import { body, json, paginate, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof standAnnouncements.$inferInsert;

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const rows = await db.select().from(standAnnouncements).orderBy(desc(standAnnouncements.start_date));
  return json(paginate(rows));
}

export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<Partial<Input>>(req);
  const errors: Record<string, string[]> = {};
  if (!b.title?.toString().trim()) errors.title = ["Title is required."];
  if (!b.description?.toString().trim()) errors.description = ["Description is required."];
  if (!b.start_date) errors.start_date = ["Start date is required."];
  if (!b.end_date) errors.end_date = ["End date is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [row] = await db
    .insert(standAnnouncements)
    .values({
      title: b.title!,
      description: b.description!,
      locations: b.locations ?? [],
      start_date: b.start_date!,
      end_date: b.end_date!,
      is_published: b.is_published ?? false,
      created_by: admin.id,
    })
    .returning();

  await audit(admin, "announcement.create", { subject_type: "StandAnnouncement", subject_id: row.id, subject_label: row.title });
  return json(row, 201);
}
