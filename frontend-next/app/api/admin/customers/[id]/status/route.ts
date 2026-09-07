import { NextResponse } from "next/server";
import { and, eq, not } from "drizzle-orm";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/**
 * PATCH /admin/customers/:id/status — activate/deactivate a customer.
 * Deactivating revokes their sessions but keeps their order history, which
 * is why it's the safe alternative to deleting a customer who has ordered.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ is_active?: boolean }>(req);
  const [customer] = await db
    .update(users)
    .set({ is_active: b.is_active ?? not(users.is_active), updated_at: new Date() })
    .where(and(eq(users.id, id), eq(users.role, "customer")))
    .returning();
  if (!customer) return fail("Customer not found.", 404);

  if (!customer.is_active) await db.delete(authTokens).where(eq(authTokens.user_id, id));

  await audit(admin, "customer.status", {
    subject_type: "User", subject_id: id, subject_label: customer.name,
    note: customer.is_active ? "Activated" : "Deactivated",
  });
  return json({ ...toPublicUser(customer), created_at: customer.created_at });
}
