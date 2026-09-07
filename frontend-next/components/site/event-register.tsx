"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { EventBooking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EventConfirmation } from "./event-confirmation";

export function EventRegister({ eventId, soldOut }: { eventId: string; soldOut: boolean }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companions, setCompanions] = useState<string[]>([]);

  function reset() {
    setBooking(null);
    setName("");
    setPhone("");
    setEmail("");
    setCompanions([]);
  }

  async function submit() {
    if (!token && (!name.trim() || !phone.trim())) {
      toast.error("Enter your name and WhatsApp number.");
      return;
    }
    setLoading(true);
    try {
      const res = await api<EventBooking>(`/events/${eventId}/register`, {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          guest_name: name || undefined,
          guest_phone: phone || undefined,
          guest_email: email || undefined,
          companions: companions.map((c) => c.trim()).filter(Boolean),
        }),
      });
      setBooking(res);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not complete your booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button className="rounded-full" disabled={soldOut} onClick={() => setOpen(true)}>
        {soldOut ? "Sold out" : "Reserve a seat"}
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-lg" showCloseButton>
          {booking ? (
            <EventConfirmation booking={booking} />
          ) : (
            <div className="space-y-5 p-2">
              <DialogTitle className="font-[family-name:var(--font-display)] text-xl font-bold">
                Reserve your seat
              </DialogTitle>

              {token ? (
                <p className="rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm">
                  Booking as <span className="font-semibold">{user?.name}</span> · {user?.email || user?.phone}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">WhatsApp number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 xxx xxxx" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Email (optional)</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Coming with anyone?</Label>
                {companions.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={c}
                      placeholder="Guest's name"
                      onChange={(e) => setCompanions(companions.map((x, xi) => (xi === i ? e.target.value : x)))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label="Remove guest"
                      onClick={() => setCompanions(companions.filter((_, xi) => xi !== i))}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCompanions([...companions, ""])}
                >
                  <Plus className="size-3.5" /> Add someone coming with you
                </Button>
              </div>

              {!token && (
                <p className="text-xs text-muted-foreground">
                  Have an account? <Link href="/login?next=/events" className="font-semibold text-primary hover:underline">Sign in</Link> for faster booking next time — you can still book as a guest.
                </p>
              )}

              <Button size="lg" className="w-full rounded-full" disabled={loading} onClick={submit}>
                {loading ? "Booking…" : "Confirm booking"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
