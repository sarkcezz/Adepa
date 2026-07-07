import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit, tempPassword } from "@/app/api/_lib/admin";

/** POST /admin/employees/:id/reset-password — issue a new temp password, ending sessions. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const pw = tempPassword();
  const [employee] = await db
    .update(users)
    .set({ password: bcrypt.hashSync(pw, 12), force_password_change: true, updated_at: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!employee) return fail("Employee not found.", 404);

  await db.delete(authTokens).where(eq(authTokens.user_id, id));
  await audit(admin, "employee.reset_password", { subject_type: "User", subject_id: id, subject_label: employee.name });

  return json({ temp_password: pw });
}
