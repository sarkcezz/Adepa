"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    } catch {
      /* server returns a generic response regardless — never reveal existence */
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a reset link. It expires in 60 minutes.
        </p>
        <Button className="mt-6 w-full rounded-full" render={<Link href="/login" />}>Back to sign in</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send a reset link.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}
