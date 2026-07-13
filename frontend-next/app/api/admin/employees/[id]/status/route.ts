import { NextResponse } from "next/server";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** PATCH /admin/employees/:id/status — activate/deactivate. Deactivating revokes sessions. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ is_active?: boolean }>(req);
  const [employee] = await db
    .update(users)
    .set({ is_active: b.is_active ?? not(users.is_active), updated_at: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!employee) return fail("Employee not found.", 404);

  if (!employee.is_active) await db.delete(authTokens).where(eq(authTokens.user_id, id));

  await audit(admin, "employee.status", {
    subject_type: "User", subject_id: id, subject_label: employee.name,
    note: employee.is_active ? "Activated" : "Deactivated",
  });
  return json(toPublicUser(employee));
}
