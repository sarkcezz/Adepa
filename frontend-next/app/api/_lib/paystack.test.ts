import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "./paystack";

const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_shared_secret";
  });
  afterEach(() => {
    process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
  });

  it("accepts a correctly signed payload", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "abc123" } });
    const signature = createHmac("sha512", "sk_test_shared_secret").update(body).digest("hex");
    expect(await verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "abc123" } });
    const signature = createHmac("sha512", "sk_test_shared_secret").update(body).digest("hex");
    const tampered = JSON.stringify({ event: "charge.success", data: { reference: "different" } });
    expect(await verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a missing signature", async () => {
    expect(await verifyWebhookSignature("{}", null)).toBe(false);
  });

  it("rejects when no secret is configured", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    expect(await verifyWebhookSignature("{}", "anything")).toBe(false);
  });
});
