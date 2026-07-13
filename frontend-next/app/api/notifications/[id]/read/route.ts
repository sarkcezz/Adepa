import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** POST /notifications/:id/read — mark one of the user's own notifications read. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const [row] = await db
    .update(notifications)
    .set({ is_read: true })
    .where(and(eq(notifications.id, id), eq(notifications.user_id, user.id)))
    .returning();
  if (!row) return fail("Notification not found.", 404);

  return json(row);
}
