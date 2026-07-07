import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { standAnnouncements } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

type Input = typeof standAnnouncements.$inferInsert;
const FIELDS: (keyof Input)[] = ["title", "description", "locations", "start_date", "end_date", "is_published"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<Partial<Input>>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };
  for (const f of FIELDS) if (f in b) patch[f] = b[f];

  const [row] = await db.update(standAnnouncements).set(patch).where(eq(standAnnouncements.id, id)).returning();
  if (!row) return fail("Announcement not found.", 404);

  await audit(admin, "announcement.update", { subject_type: "StandAnnouncement", subject_id: id, subject_label: row.title });
  return json(row);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [row] = await db.delete(standAnnouncements).where(eq(standAnnouncements.id, id)).returning();
  if (!row) return fail("Announcement not found.", 404);

  await audit(admin, "announcement.delete", { subject_type: "StandAnnouncement", subject_id: id, subject_label: row.title });
  return json({ message: "Announcement removed." });
}
