"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { EventBooking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EventConfirmation } from "@/components/site/event-confirmation";

export default function ManageEventBookingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<EventBooking | null | "not-found">(null);
  const [companions, setCompanions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    api<EventBooking>(`/events/registrations/${code}`)
      .then((b) => {
        setBooking(b);
        setCompanions(b.companions);
      })
      .catch(() => setBooking("not-found"));
  }
  useEffect(load, [code]);

  async function saveCompanions() {
    setSaving(true);
    try {
      const updated = await api<EventBooking>(`/events/registrations/${code}`, {
        method: "PATCH",
        body: JSON.stringify({ companions: companions.map((c) => c.trim()).filter(Boolean) }),
      });
      setBooking(updated);
      setCompanions(updated.companions);
      toast.success("Booking updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update your booking.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking() {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    setCancelling(true);
    try {
      await api(`/events/registrations/${code}`, { method: "DELETE" });
      toast.success("Booking cancelled.");
      router.push("/events");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not cancel your booking.");
      setCancelling(false);
    }
  }

  if (booking === "not-found") {
    return (
      <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Booking not found</h1>
        <p className="mt-2 text-muted-foreground">Double-check your code, or it may have already been cancelled.</p>
        <Link href="/events/manage" className="mt-6 font-semibold text-primary hover:underline">Try another code</Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12">
        <Skeleton className="h-[520px] w-full rounded-3xl" />
      </div>
    );
  }

  const companionsChanged = JSON.stringify(companions.map((c) => c.trim()).filter(Boolean)) !== JSON.stringify(booking.companions);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 print:py-0">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" /> Back to events
      </Link>

      <div className="mt-6">
        <EventConfirmation booking={booking} />
      </div>

      <div className="mt-8 space-y-5 rounded-3xl border border-border/60 bg-card p-6 print:hidden">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Edit your party</h2>
          <p className="text-xs text-muted-foreground">Add or remove guests you're bringing.</p>
        </div>

        <div className="space-y-2">
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
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setCompanions([...companions, ""])}>
            <Plus className="size-3.5" /> Add someone coming with you
          </Button>
        </div>

        {companionsChanged && (
          <Button className="w-full rounded-full" disabled={saving} onClick={saveCompanions}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        )}

        {booking.contact_editable && (
          <p className="text-xs text-muted-foreground">
            Need to change your name, WhatsApp number, or email? WhatsApp us and we'll update it for you.
          </p>
        )}

        <div className="border-t border-border/60 pt-4">
          <Label className="text-xs text-destructive">Cancel booking</Label>
          <p className="mt-1 text-xs text-muted-foreground">This frees up your spot for someone else and can&apos;t be undone.</p>
          <Button
            variant="outline"
            className="mt-3 w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={cancelling}
            onClick={cancelBooking}
          >
            <Trash2 className="size-4" /> {cancelling ? "Cancelling…" : "Cancel my booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}
