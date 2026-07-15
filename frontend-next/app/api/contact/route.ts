export const dynamic = "force-dynamic";

import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { body, json, validationError } from "@/app/api/_lib/http";
import { sendEmail } from "@/app/api/_lib/notify";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

/** POST /contact — the public "Contact us" form. */
export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) return validationError({ message: [`Too many messages. Try again in ${limit.retryAfterSec}s.`] });

  const b = await body<{ name?: string; email?: string; phone?: string; subject?: string; message?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.trim()) errors.name = ["Name is required."];
  if (!b.email?.trim()) errors.email = ["Email is required."];
  if (!b.subject?.trim()) errors.subject = ["Subject is required."];
  if (!b.message?.trim()) errors.message = ["Message is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [saved] = await db
    .insert(contactMessages)
    .values({
      name: b.name!.trim(),
      email: b.email!.trim().toLowerCase(),
      phone: b.phone?.trim() || null,
      subject: b.subject!.trim(),
      message: b.message!.trim(),
    })
    .returning();

  waitUntil(sendEmail(
    process.env.ADMIN_ALERT_EMAIL ?? "orders@adepaporkhub.shop",
    `Contact form: ${saved.subject}`,
    `From: ${saved.name} <${saved.email}>${saved.phone ? ` · ${saved.phone}` : ""}\n\n${saved.message}`,
  ));

  return json({ ok: true }, 201);
}
