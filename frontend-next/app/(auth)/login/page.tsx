"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Role } from "@/lib/types";

const STAFF_DOMAIN = "@adepaporkhub.shop";

/** Both routes redirect here, so every role lands home in one place. */
function homeFor(role: Role, next: string | null) {
  if (next) return next;
  if (role === "admin") return "/admin";
  if (role === "employee") return "/staff";
  return "/account";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, employeeLogin } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);

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

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Adepa account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
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
