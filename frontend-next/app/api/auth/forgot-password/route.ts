import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { sendEmail } from "@/app/api/_lib/notify";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";
import { siteUrl } from "@/lib/site";

/**
 * POST /auth/forgot-password — issue a reset token. Always returns a generic
 * success (no account enumeration).
 */
export async function POST(req: Request) {
  const limit = rateLimit(`forgot-password:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const b = await body<{ email?: string }>(req);
  const email = b.email?.trim().toLowerCase();
  const generic = { message: "If an account exists, a reset link has been sent." };
  if (!email) return json(generic);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db
      .insert(passwordResetTokens)
      .values({ email, token, created_at: new Date() })
      .onConflictDoUpdate({ target: passwordResetTokens.email, set: { token, created_at: new Date() } });

    const link = `${siteUrl()}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
    waitUntil(sendEmail(
      email,
      "Reset your Adepa password",
      [
        "Reset your Adepa Pork Hub password",
        "",
        "We received a request to reset the password on your account.",
        "",
        `Reset your password: ${link}`,
        "",
        "This link expires in 60 minutes.",
        "",
        "If you didn't request this, you can safely ignore this email — your password will not be changed.",
      ].join("\n"),
      resetPasswordEmailHtml(link),
    ));
  }

  return json(generic);
}

function resetPasswordEmailHtml(link: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#fdf9f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf9f6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;">
                <span style="font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#651723;">Adepa Pork Hub</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#2c2522;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0; font-size:15px; line-height:1.6; color:#2c2522;">
                <p style="margin:0 0 16px;">We received a request to reset the password on your Adepa account. Click the button below to choose a new one.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;" align="center">
                <a href="${link}" style="display:inline-block; padding:13px 32px; border-radius:999px; background:#af3d38; color:#fdf7f3; font-size:15px; font-weight:700; text-decoration:none;">Reset password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0; font-size:13px; line-height:1.6; color:#8a7f78;">
                <p style="margin:0 0 8px;">Button not working? Paste this link into your browser:</p>
                <p style="margin:0; word-break:break-all;"><a href="${link}" style="color:#af3d38;">${link}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0; font-size:13px; line-height:1.6; color:#8a7f78;">
                <p style="margin:0;">This link expires in 60 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 28px; border-top:1px solid #f0e9e4; margin-top:24px;">
                <p style="margin:20px 0 0; font-size:12px; line-height:1.6; color:#a89e97;">Adepa Pork Hub · Ejisu-Krapa, Ashanti Region<br />Questions? <a href="mailto:orders@adepaporkhub.shop" style="color:#af3d38;">orders@adepaporkhub.shop</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
