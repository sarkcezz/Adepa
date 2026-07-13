/**
 * Server-side Paystack verification.
 *
 * Same "graceful until configured" posture as notify.ts: without
 * PAYSTACK_SECRET_KEY, verifyTransaction() falls back to trusting that a
 * reference was supplied (the prior behaviour) but logs a loud warning, so
 * nothing breaks before the key exists — but the gap is visible in logs and
 * closes itself the moment the key is set.
 */
interface VerifyResult {
  ok: boolean;
  amountKobo?: number;
  currency?: string;
  paidAt?: string;
}

export async function verifyTransaction(reference: string, expectedAmountKobo: number): Promise<VerifyResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.warn(
      `[paystack:unverified] PAYSTACK_SECRET_KEY not set — trusting reference "${reference}" without verification.`,
    );
    return { ok: true };
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) return { ok: false };

  const body = (await res.json()) as {
    status: boolean;
    data?: { status: string; amount: number; currency: string; paid_at: string };
  };
  const data = body.data;
  if (!body.status || !data || data.status !== "success") return { ok: false };
  if (data.currency !== "GHS") return { ok: false };
  if (data.amount !== expectedAmountKobo) return { ok: false };

  return { ok: true, amountKobo: data.amount, currency: data.currency, paidAt: data.paid_at };
}

/** HMAC-SHA512 verification of the `x-paystack-signature` webhook header. */
export async function verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}
