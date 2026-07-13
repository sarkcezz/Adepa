import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ name?: string; email?: string; phone?: string; position?: string }>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (b.name != null) patch.name = b.name.trim();
  if (b.email !== undefined) patch.email = b.email?.trim().toLowerCase() || null;
  if (b.phone != null) patch.phone = b.phone.trim();
  if (b.position !== undefined) patch.position = b.position?.trim() || null;

  const [employee] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  if (!employee) return fail("Employee not found.", 404);

  await audit(admin, "employee.update", { subject_type: "User", subject_id: id, subject_label: employee.name });
  return json(toPublicUser(employee));
}
