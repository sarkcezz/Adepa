"use client";

// Minimal typing for the Paystack inline popup loaded via next/script.
declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: PaystackSetup) => { openIframe: () => void };
    };
  }
}

interface PaystackSetup {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref?: string;
  metadata?: Record<string, unknown>;
  callback: (res: { reference: string }) => void;
  onClose: () => void;
}

export interface OpenPaystackArgs {
  email: string;
  amountKobo: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}

export function openPaystack({ email, amountKobo, reference, metadata, onSuccess, onClose }: OpenPaystackArgs) {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!window.PaystackPop) {
    throw new Error("Payment library not loaded. Refresh and try again.");
  }
  if (!key) {
    throw new Error("Payment is not configured.");
  }
  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: amountKobo,
    currency: "GHS",
    ref: reference,
    metadata: metadata ?? {},
    callback: (res) => onSuccess(res.reference),
    onClose: () => onClose?.(),
  });
  handler.openIframe();
}
