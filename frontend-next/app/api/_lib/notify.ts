/**
 * Notification delivery — email + SMS.
 *
 * Delivery is deferred until provider credentials exist (SMTP / Hubtel SMS),
 * mirroring the deferred Paystack config. Until then these log and no-op so
 * the calling flows (orders, cron) work without external services. Wire the
 * real senders here when the keys are set — every caller already routes
 * through these two functions.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!process.env.SMTP_URL && !process.env.RESEND_API_KEY) {
    console.log(`[email:noop] → ${to} :: ${subject}`);
    return;
  }
  // TODO: integrate Resend/SMTP here using RESEND_API_KEY / SMTP_URL.
  console.log(`[email] → ${to} :: ${subject}\n${body}`);
}

export async function sendSms(to: string, message: string): Promise<void> {
  if (!process.env.HUBTEL_CLIENT_ID) {
    console.log(`[sms:noop] → ${to} :: ${message.slice(0, 60)}`);
    return;
  }
  // TODO: integrate Hubtel SMS here using HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET.
  console.log(`[sms] → ${to} :: ${message}`);
}
