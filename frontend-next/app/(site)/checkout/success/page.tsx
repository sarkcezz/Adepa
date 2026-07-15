"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";

function Success() {
  const params = useSearchParams();
  const order = params.get("order");
  const { token } = useAuth();

  return (
    <div className="mx-auto grid min-h-[70svh] w-full max-w-lg place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold">Order placed!</h1>
        <p className="mt-2 text-muted-foreground">
          {order ? (
            <>
              Your order <span className="font-mono font-semibold text-foreground">{order}</span> is confirmed.
              We&apos;ll keep you posted by email/SMS as it moves.
            </>
          ) : (
            "Your order is confirmed."
          )}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {token ? (
            <Button size="lg" className="rounded-full" render={<Link href="/account" />}>
              View my orders <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="lg" className="rounded-full" render={<Link href="/register" />}>
              Create an account to track it <ArrowRight className="size-4" />
            </Button>
          )}
          <Button size="lg" variant="outline" className="rounded-full" render={<Link href="/menu" />}>
            Keep shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Success />
    </Suspense>
  );
}
