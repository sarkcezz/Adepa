"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function StaffLoginPage() {
  const router = useRouter();
  const employeeLogin = useAuth((s) => s.employeeLogin);
  const [form, setForm] = useState({ employee_id: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await employeeLogin(form.employee_id, form.password);
      toast.success("Signed in.");
      router.push("/staff");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
        Staff portal
      </span>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold">Employee sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Use your Adepa employee ID and password.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="eid">Employee ID</Label>
          <Input
            id="eid"
            placeholder="APH-0001"
            required
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Sign in to portal"}
        </Button>
      </form>

      <div className="mt-6 rounded-xl bg-secondary/60 px-3 py-2.5 text-center text-xs text-muted-foreground">
        Not staff?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Customer sign in
        </Link>
      </div>
    </Card>
  );
}
