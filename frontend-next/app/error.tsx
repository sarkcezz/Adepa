"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook for a real error reporter (Sentry, etc.) later.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60svh] place-items-center px-4 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A hiccup on our end. Try again, and if it persists, reach us on WhatsApp.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button className="rounded-full" onClick={reset}>Try again</Button>
          <Button variant="outline" className="rounded-full" render={<Link href="/" />}>Go home</Button>
        </div>
      </div>
    </div>
  );
}
