import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** POST /notifications/read-all — mark all of the user's notifications read. */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(and(eq(notifications.user_id, user.id), eq(notifications.is_read, false)));

  return json({ message: "All notifications marked read." });
}
