import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, sendSms } from "./notify";

/**
 * Records an in-app notification and best-effort sends it over email/SMS
 * (both are no-ops until their provider keys are configured — see notify.ts).
 * Never throws: a notification failure must not fail the request that
 * triggered it (an order placing successfully matters more than the email).
 */
export async function notifyUser(
  userId: string,
  opts: { type: string; title: string; message: string; email?: boolean; sms?: boolean },
) {
  try {
    await db.insert(notifications).values({
      user_id: userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
    });

    if (opts.email || opts.sms) {
      const [user] = await db
        .select({ email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (opts.email && user?.email) await sendEmail(user.email, opts.title, opts.message);
      if (opts.sms && user?.phone) await sendSms(user.phone, `${opts.title}: ${opts.message}`);
    }
  } catch (e) {
    console.error("[notifyUser] failed", e);
  }
}
