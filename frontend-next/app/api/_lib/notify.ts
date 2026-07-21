import nodemailer, { type Transporter } from "nodemailer";

/**
 * Notification delivery — email + SMS.
 *
 * Email sends over SMTP (Hostinger mailbox) once SMTP_HOST is configured;
 * SMS delivery is still deferred until Hubtel credentials exist. Both no-op
 * (log only) until their respective env vars are set, so the calling flows
 * (orders, cron) work without external services either way.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false", // true (SSL/465) by default
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string, html?: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:noop] → ${to} :: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
      ...(html ? { html } : {}),
    });
  } catch (e) {
    console.error(`[email:failed] → ${to} :: ${subject}`, e);
  }
}

export async function sendSms(to: string, message: string): Promise<void> {
  if (!process.env.HUBTEL_CLIENT_ID) {
    console.log(`[sms:noop] → ${to} :: ${message.slice(0, 60)}`);
    return;
  }
  // TODO: integrate Hubtel SMS here using HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET.
  console.log(`[sms] → ${to} :: ${message}`);
}
