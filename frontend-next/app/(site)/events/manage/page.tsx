"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ManageEventLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/events/manage/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Ticket className="size-6" />
      </div>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold">Manage your booking</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the booking code from your confirmation email or ticket.
      </p>

      <div className="mt-8 w-full space-y-3 text-left">
        <Label className="text-xs">Booking code</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="e.g. 7K2M9X4B"
          className="text-center font-mono text-lg tracking-[0.14em]"
        />
        <Button size="lg" className="w-full rounded-full" disabled={!code.trim()} onClick={go}>
          Find my booking
        </Button>
      </div>
    </div>
  );
}
