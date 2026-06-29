"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function ChangePasswordPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { user, token, setUser } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mounted && !token) router.replace("/login");
  }, [mounted, token, router]);

  if (!mounted || !token) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (form.next !== form.confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ current_password: form.current, new_password: form.next, new_password_confirmation: form.confirm }),
      });
      if (user) setUser({ ...user, force_password_change: false });
      toast.success("Password updated.");
      const home = user?.role === "admin" ? "/admin" : user?.role === "employee" ? "/staff" : "/account";
      router.push(home);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
          <ShieldAlert className="size-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.name ? `Hi ${user.name.split(" ")[0]}, ` : ""}you&apos;re using a temporary password. Choose a permanent one to continue.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cur">Current / temporary password</Label>
          <Input id="cur" type="password" required value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="np">New password</Label>
          <Input id="np" type="password" required minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp">Confirm new password</Label>
          <Input id="cp" type="password" required minLength={8} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
