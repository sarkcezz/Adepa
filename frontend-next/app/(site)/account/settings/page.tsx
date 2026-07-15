"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import type { User as UserType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountSettingsPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/settings");
  }, [mounted, token, router]);

  if (!mounted || !token || !user) return null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to account
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Update your name, email, and phone.</p>
        </div>
      </div>

      {/* Keyed by user id: mounts fresh once `user` is guaranteed loaded, so
          form state can initialize straight from it — no sync effect needed. */}
      <SettingsForm key={user.id} user={user} token={token} />

      <Link href="/change-password" className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">
        Change password
      </Link>
    </div>
  );
}

function SettingsForm({ user, token }: { user: UserType; token: string }) {
  const setUser = useAuth((s) => s.setUser);
  const [form, setForm] = useState({ name: user.name, email: user.email ?? "", phone: user.phone, birth_date: user.birth_date ?? "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api<UserType>("/account", {
        method: "PUT",
        token,
        body: JSON.stringify(form),
      });
      setUser(updated);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-card p-6">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Birthday (for rewards)</Label>
        <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
      </div>
      <Button className="w-full rounded-full" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
