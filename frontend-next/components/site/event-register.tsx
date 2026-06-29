"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { openPaystack } from "@/lib/paystack";
import { Button } from "@/components/ui/button";

export function EventRegister({ eventId, amountKobo, soldOut }: { eventId: string; amountKobo: number; soldOut: boolean }) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!token) {
      router.push("/login?next=/events");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ paystack: { reference: string; amount: number } }>(`/events/${eventId}/register`, {
        method: "POST",
        token,
      });
      openPaystack({
        email: user?.email || `${user?.phone}@adepaporkhub.shop`,
        amountKobo: res.paystack.amount ?? amountKobo,
        reference: res.paystack.reference,
        metadata: { event_id: eventId },
        onSuccess: () => toast.success("Registration confirmed. See you there!"),
        onClose: () => toast.info("Payment cancelled."),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not register.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="rounded-full" disabled={soldOut || loading} onClick={register}>
      {soldOut ? "Sold out" : loading ? "…" : "Reserve a seat"}
    </Button>
  );
}
