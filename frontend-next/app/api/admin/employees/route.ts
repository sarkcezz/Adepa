export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, json, paginate, validationError } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";
import { audit, nextEmployeeId, tempPassword } from "@/app/api/_lib/admin";
import { sendEmail, sendSms } from "@/app/api/_lib/notify";

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const rows = await db
    .select()
    .from(users)
    .where(inArray(users.role, ["employee", "admin"]))
    .orderBy(desc(users.created_at));

  return json(paginate(rows.map(toPublicUser)));
}

/** POST /admin/employees — create a staff account with a temp password. */
export async function POST(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const b = await body<{ name?: string; email?: string; phone?: string; position?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.trim()) errors.name = ["Name is required."];
  if (!b.phone?.trim()) errors.phone = ["Phone is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const pw = tempPassword();
  const [employee] = await db
    .insert(users)
    .values({
      name: b.name!.trim(),
      email: b.email?.trim().toLowerCase() || null,
      phone: b.phone!.trim(),
      password: bcrypt.hashSync(pw, 12),
      role: "employee",
      employee_id: await nextEmployeeId(),
      position: b.position?.trim() || null,
      force_password_change: true,
    })
    .returning();

  await audit(admin, "employee.create", { subject_type: "User", subject_id: employee.id, subject_label: employee.name });

  const welcome = `Welcome to Adepa, ${employee.name}. Your staff ID is ${employee.employee_id} and temporary password is ${pw}. You'll be asked to set a new password on first login.`;
  void sendSms(employee.phone, welcome);
  if (employee.email) void sendEmail(employee.email, "Welcome to Adepa Pork Hub", welcome);

  return json({ employee: toPublicUser(employee), temp_password: pw }, 201);
}
