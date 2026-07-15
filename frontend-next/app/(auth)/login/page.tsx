"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { homeFor } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GoogleIcon } from "@/components/site/social-icons";

const STAFF_DOMAIN = "@adepaporkhub.shop";

const OAUTH_ERROR_MESSAGE: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet — use email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "Could not sign in with Google. Try again.",
  google_unverified: "That Google account's email isn't verified.",
  google_staff_email: "That email belongs to a staff account — sign in with your employee ID or company email above instead.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, employeeLogin } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = params.get("error");
    if (error) toast.error(OAUTH_ERROR_MESSAGE[error] ?? "Could not sign in.");
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const identifier = form.identifier.trim();
      // No "@" at all can't be an email, so it's an employee ID; an "@"
      // address on our own domain is staff too — everything else is a
      // customer email. One form, one decision point.
      const isStaff = !identifier.includes("@") || identifier.toLowerCase().endsWith(STAFF_DOMAIN);

      const user = isStaff
        ? await employeeLogin(identifier, form.password)
        : await login(identifier, form.password);

      toast.success("Welcome back!");
      router.push(homeFor(user.role, params.get("next")));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    const next = params.get("next");
    window.location.href = `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Adepa account.</p>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-6 w-full rounded-full"
        onClick={continueWithGoogle}
      >
        <GoogleIcon className="size-4" /> Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or sign in with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or employee ID</Label>
          <Input
            id="identifier"
            required
            placeholder="you@example.com or APH-0001"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Adepa staff sign in above with your employee ID or {STAFF_DOMAIN} email.
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
