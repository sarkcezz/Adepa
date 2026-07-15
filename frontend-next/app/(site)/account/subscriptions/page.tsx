"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Truck, Pause, Play, X, Repeat } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs } from "@/lib/format";
import type { Address, Product, Paginated } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Frequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
const FREQ_LABEL: Record<Frequency, string> = { WEEKLY: "Weekly", BIWEEKLY: "Every 2 weeks", MONTHLY: "Monthly" };

interface Subscription {
  id: string;
  items: { product_id: string; quantity: number }[];
  frequency: Frequency;
  delivery_method: "HOME" | "PICKUP";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  next_delivery_date: string;
}

export default function SubscriptionsPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/subscriptions");
  }, [mounted, token, router]);

  function load() {
    if (!token) return;
    api<{ data: Subscription[] }>("/subscriptions", { token }).then((r) => setSubs(r.data)).catch(() => setSubs([]));
  }
  useEffect(load, [token]);

  useEffect(() => {
    api<Paginated<Product>>("/products?active_only=1").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api(`/subscriptions/${id}`, { method: "PATCH", token: token!, body: JSON.stringify({ status }) });
      load();
    } catch {
      toast.error("Could not update subscription.");
    }
  }

  if (!mounted || !token) return null;

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Product";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Subscriptions</h1>
        <Button className="rounded-full" onClick={() => setOpen(true)}><Plus className="size-4" /> New box</Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">A recurring meat box, delivered automatically — pay on delivery.</p>

      <div className="mt-8 space-y-3">
        {subs === null ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : subs.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Repeat className="size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No subscriptions yet.</p>
            <Button className="mt-4 rounded-full" onClick={() => setOpen(true)}>Start a box</Button>
          </div>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {FREQ_LABEL[s.frequency]}
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      s.status === "ACTIVE" && "bg-primary/10 text-primary",
                      s.status === "PAUSED" && "bg-accent/20 text-accent-foreground",
                      s.status === "CANCELLED" && "bg-destructive/10 text-destructive",
                    )}>
                      {s.status.toLowerCase()}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.items.map((it) => `${productName(it.product_id)} × ${it.quantity}`).join(", ")}
                  </p>
                  {s.status !== "CANCELLED" && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Truck className="size-3.5" /> Next: {s.next_delivery_date}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {s.status === "ACTIVE" && (
                    <button onClick={() => setStatus(s.id, "PAUSED")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary" aria-label="Pause">
                      <Pause className="size-4" />
                    </button>
                  )}
                  {s.status === "PAUSED" && (
                    <button onClick={() => setStatus(s.id, "ACTIVE")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary" aria-label="Resume">
                      <Play className="size-4" />
                    </button>
                  )}
                  {s.status !== "CANCELLED" && (
                    <button onClick={() => setStatus(s.id, "CANCELLED")} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Cancel">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <NewSubscriptionSheet open={open} onOpenChange={setOpen} products={products} token={token} onCreated={load} />
    </div>
  );
}

function NewSubscriptionSheet({
  open, onOpenChange, products, token, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; products: Product[]; token: string; onCreated: () => void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<Frequency>("WEEKLY");
  const [deliveryMethod, setDeliveryMethod] = useState<"HOME" | "PICKUP">("HOME");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<{ data: Address[] }>("/addresses", { token }).then((r) => {
      const a = r.data;
      setAddresses(a);
      const def = a.find((x) => x.is_default) || a[0];
      if (def) setAddressId(def.id);
    }).catch(() => {});
  }, [open, token]);

  function toggle(id: string) {
    setQty((q) => {
      const next = { ...q };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  const items = Object.entries(qty).map(([product_id, quantity]) => ({ product_id, quantity }));
  const subtotal = items.reduce((n, it) => n + (products.find((p) => p.id === it.product_id)?.price_kobo ?? 0) * it.quantity, 0);

  async function create() {
    if (items.length === 0) return toast.error("Pick at least one product.");
    if (deliveryMethod === "HOME" && !addressId) return toast.error("Choose a delivery address.");
    setSaving(true);
    try {
      await api("/subscriptions", {
        method: "POST",
        token,
        body: JSON.stringify({ items, frequency, delivery_method: deliveryMethod, address_id: addressId || undefined }),
      });
      toast.success("Subscription started!");
      setQty({});
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not start subscription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
        <SheetTitle className="sr-only">New subscription box</SheetTitle>
        <div className="border-b border-border/60 px-6 py-4"><h2 className="font-[family-name:var(--font-display)] text-xl font-bold">New box</h2></div>
        <div className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</p>
            <div className="space-y-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <input type="checkbox" checked={!!qty[p.id]} onChange={() => toggle(p.id)} className="size-4 accent-primary" />
                  <span className="flex-1 text-sm">{p.name}</span>
                  {qty[p.id] ? (
                    <input
                      type="number"
                      min={1}
                      value={qty[p.id]}
                      onChange={(e) => setQty((q) => ({ ...q, [p.id]: Math.max(1, Number(e.target.value)) }))}
                      className="h-8 w-14 rounded-lg border border-input bg-transparent px-2 text-center text-sm"
                    />
                  ) : null}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</p>
            <div className="flex gap-2">
              {(["WEEKLY", "BIWEEKLY", "MONTHLY"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "flex-1 rounded-full border-2 px-3 py-2 text-xs font-semibold transition-colors",
                    frequency === f ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery</p>
            <div className="flex gap-2">
              {(["HOME", "PICKUP"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDeliveryMethod(m)}
                  className={cn(
                    "flex-1 rounded-full border-2 px-3 py-2 text-xs font-semibold transition-colors",
                    deliveryMethod === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {m === "HOME" ? "Home delivery" : "Stand pickup"}
                </button>
              ))}
            </div>
            {deliveryMethod === "HOME" && (
              addresses.length > 0 ? (
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="mt-2 h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} · {a.recipient}</option>)}
                </select>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  No saved addresses — <Link href="/account/addresses" className="font-semibold text-primary hover:underline">add one</Link> first.
                </p>
              )
            )}
          </div>

          {items.length > 0 && (
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
              Estimated per box: <span className="font-bold">{formatGhs(subtotal)}</span>
            </p>
          )}

          <Button className="w-full rounded-full" size="lg" disabled={saving} onClick={create}>
            {saving ? "Starting…" : "Start subscription"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
