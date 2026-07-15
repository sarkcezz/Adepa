"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import type { Address } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const EMPTY = { label: "Home", recipient: "", phone: "", area: "", district: "", landmark: "", is_default: false };

export default function AddressesPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const [items, setItems] = useState<Address[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/addresses");
  }, [mounted, token, router]);

  function load() {
    if (!token) return;
    api<{ data: Address[] }>("/addresses", { token }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }
  useEffect(load, [token]);  

  if (!mounted || !token) return null;

  async function add() {
    if (!draft.recipient || !draft.area) return toast.error("Recipient and area are required.");
    setSaving(true);
    try {
      await api("/addresses", { method: "POST", token: token!, body: JSON.stringify(draft) });
      toast.success("Address added.");
      setOpen(false); setDraft(EMPTY); load();
    } catch { toast.error("Could not save address."); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remove this address?")) return;
    try {
      await api(`/addresses/${id}`, { method: "DELETE", token: token! });
      setItems((p) => p?.filter((a) => a.id !== id) ?? null);
    } catch { toast.error("Could not remove."); }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Addresses</h1>
        {items && items.length < 3 && (
          <Button className="rounded-full" onClick={() => { setDraft(EMPTY); setOpen(true); }}><Plus className="size-4" /> Add</Button>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {items === null ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <MapPin className="size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No saved addresses.</p>
            <Button className="mt-4 rounded-full" onClick={() => setOpen(true)}><Plus className="size-4" /> Add address</Button>
          </div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {a.label} · {a.recipient}
                  {a.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"><Star className="size-3" /> Default</span>}
                </p>
                <p className="text-sm text-muted-foreground">{a.area}, {a.district}</p>
                <p className="text-xs text-muted-foreground">{a.phone}{a.landmark ? ` · ${a.landmark}` : ""}</p>
              </div>
              <button onClick={() => remove(a.id)} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Add address</SheetTitle>
          <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Add address</h2></div>
          <div className="space-y-4 p-6">
            {([
              ["Label", "label"], ["Recipient name", "recipient"], ["Phone", "phone"], ["Area", "area"], ["District", "district"], ["Landmark (optional)", "landmark"],
            ] as const).map(([label, key]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} className="size-4 accent-primary" /> Set as default
            </label>
            <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={add}>{saving ? "Saving…" : "Save address"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
