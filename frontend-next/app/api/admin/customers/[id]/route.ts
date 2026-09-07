import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** Look up a customer by id, scoped to the customer role so these endpoints can never touch staff accounts. */
async function findCustomer(id: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "customer")))
    .limit(1);
  return row;
}

/** PUT /admin/customers/:id — edit a customer's name, phone, or email. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const customer = await findCustomer(id);
  if (!customer) return fail("Customer not found.", 404);

  const b = await body<{ name?: string; phone?: string; email?: string | null }>(req);
  const patch: Record<string, unknown> = { updated_at: new Date() };

  if (b.name != null) {
    const name = b.name.trim();
    if (!name) return fail("Name can't be empty.", 422);
    patch.name = name;
  }

  // phone and email are unique across every account, so check for a clash
  // before writing rather than surfacing a raw constraint error.
  if (b.phone != null) {
    const phone = b.phone.trim();
    if (!phone) return fail("Phone can't be empty.", 422);
    const [clash] = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), ne(users.id, id))).limit(1);
    if (clash) return fail("Another account already uses that phone number.", 409);
    patch.phone = phone;
  }

  if (b.email !== undefined) {
    const email = b.email?.trim().toLowerCase() || null;
    if (email) {
      const [clash] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.id, id))).limit(1);
      if (clash) return fail("Another account already uses that email address.", 409);
    }
    patch.email = email;
  }

  const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();

  await audit(admin, "customer.update", { subject_type: "User", subject_id: id, subject_label: updated.name });
  return json({ ...toPublicUser(updated), created_at: updated.created_at });
}

/**
 * DELETE /admin/customers/:id — remove a customer outright.
 *
 * `orders.customer_id` has no ON DELETE rule, so the database would refuse
 * this anyway once a customer has ordered. Rather than surface that as a
 * constraint error, check first and point the admin at deactivation, which
 * keeps the sales history intact.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const customer = await findCustomer(id);
  if (!customer) return fail("Customer not found.", 404);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.customer_id, id));

  if (count > 0) {
    return fail(
      `${customer.name} has ${count} order${count === 1 ? "" : "s"} on record — deleting the account would take that sales history with it. Deactivate them instead.`,
      409,
    );
  }

  await db.delete(users).where(eq(users.id, id));

  await audit(admin, "customer.delete", { subject_type: "User", subject_id: id, subject_label: customer.name });
  return json({ deleted: true });
}
