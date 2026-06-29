"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const tokenParam = params.get("token") ?? "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token: tokenParam, password: pw, password_confirmation: confirm }),
      });
      toast.success("Password reset. You can sign in now.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reset failed. Request a new link.");
    } finally {
      setLoading(false);
    }
  }

  const invalid = !email || !tokenParam;

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">At least 8 characters.</p>
      {invalid ? (
        <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          This reset link is invalid or incomplete. Request a new one.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf">Confirm password</Label>
            <Input id="cf" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
