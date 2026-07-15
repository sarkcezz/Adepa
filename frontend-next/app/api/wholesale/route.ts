export const dynamic = "force-dynamic";

import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { wholesaleInquiries } from "@/db/schema";
import { body, json, validationError } from "@/app/api/_lib/http";
import { sendEmail } from "@/app/api/_lib/notify";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

/** POST /wholesale — the public wholesale inquiry form. */
export async function POST(req: Request) {
  const limit = rateLimit(`wholesale:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) return validationError({ message: [`Too many submissions. Try again in ${limit.retryAfterSec}s.`] });

  const b = await body<{
    business_name?: string; contact_name?: string; business_type?: string;
    email?: string; phone?: string; estimated_volume?: string; message?: string;
  }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.business_name?.trim()) errors.business_name = ["Business name is required."];
  if (!b.contact_name?.trim()) errors.contact_name = ["Contact name is required."];
  if (!b.business_type?.trim()) errors.business_type = ["Business type is required."];
  if (!b.email?.trim()) errors.email = ["Email is required."];
  if (!b.phone?.trim()) errors.phone = ["Phone is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const [saved] = await db
    .insert(wholesaleInquiries)
    .values({
      business_name: b.business_name!.trim(),
      contact_name: b.contact_name!.trim(),
      business_type: b.business_type!.trim(),
      email: b.email!.trim().toLowerCase(),
      phone: b.phone!.trim(),
      estimated_volume: b.estimated_volume?.trim() || null,
      message: b.message?.trim() || null,
    })
    .returning();

  waitUntil(sendEmail(
    process.env.ADMIN_ALERT_EMAIL ?? "orders@adepaporkhub.shop",
    `Wholesale inquiry: ${saved.business_name}`,
    `${saved.contact_name} (${saved.business_type})\n${saved.email} · ${saved.phone}\nEst. volume: ${saved.estimated_volume ?? "—"}\n\n${saved.message ?? ""}`,
  ));

  return json({ ok: true }, 201);
}
