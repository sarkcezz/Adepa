"use client";

import { useState } from "react";
import Script from "next/script";
import { Check, Gift } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { openPaystack } from "@/lib/paystack";
import { formatGhs } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS_GHS = [50, 100, 200, 500];

export function GiftCardPurchase() {
  const { user, token } = useAuth();
  const [amountGhs, setAmountGhs] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountGhs * 100;

  async function purchase() {
    if (!token) return;
    if (!amount || amount < 5000) return toast.error("Minimum gift card amount is GHS 50.");
    setLoading(true);
    try {
      const reference = `APH-GC-${Date.now()}`.toUpperCase();
      openPaystack({
        email: user!.email || `${user!.phone}@adepaporkhub.shop`,
        amountKobo: amount,
        reference,
        onSuccess: async (ref) => {
          try {
            const card = await api<{ code: string }>("/gift-cards", {
              method: "POST",
              token,
              body: JSON.stringify({
                amount_kobo: amount,
                recipient_name: recipientName || undefined,
                recipient_email: recipientEmail || undefined,
                message: message || undefined,
                paystack_reference: ref,
              }),
            });
            setCode(card.code);
            toast.success("Gift card purchased!");
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Payment succeeded but we couldn't create the card — contact support.");
          } finally {
            setLoading(false);
          }
        },
        onClose: () => setLoading(false),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <Gift className="mx-auto size-6 text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/login?next=/promotions" className="font-semibold text-primary hover:underline">Sign in</Link> to buy a gift card.
        </p>
      </div>
    );
  }

  if (code) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <Check className="mx-auto size-6 text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Gift card code — share it with the recipient:</p>
        <p className="mt-2 select-all font-mono text-lg font-bold text-primary">{code}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <div className="flex flex-wrap gap-2">
        {PRESETS_GHS.map((v) => (
          <button
            key={v}
            onClick={() => { setAmountGhs(v); setCustomAmount(""); }}
            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
              !customAmount && amountGhs === v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            GHS {v}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs">Or custom amount (GHS)</Label>
        <Input type="number" min={50} placeholder="e.g. 150" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Recipient name (optional)</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Recipient email (optional)</Label>
          <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs">Message (optional)</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <Button className="mt-5 w-full rounded-full" size="lg" disabled={loading} onClick={purchase}>
        {loading ? "Processing…" : `Buy gift card · ${formatGhs(amount)}`}
      </Button>
    </div>
  );
}
