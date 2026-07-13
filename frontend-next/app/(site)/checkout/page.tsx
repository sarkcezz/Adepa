"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Truck, Store, Tag, CreditCard, Check, AlertTriangle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useCart, cartSubtotal, useHasMounted } from "@/lib/cart-store";
import { openPaystack } from "@/lib/paystack";
import { formatGhs } from "@/lib/format";
import type { Address, StandAnnouncement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Method = "HOME" | "PICKUP";
const WHATSAPP = "233500000000";
const DELIVERY_FEE = 1500;

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useHasMounted();
  const { user, token } = useAuth();
  const { items, clear } = useCart();
  const subtotal = cartSubtotal(items);

  const [method, setMethod] = useState<Method>("HOME");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [newAddr, setNewAddr] = useState({ label: "Home", recipient: "", phone: "", area: "", district: "", landmark: "" });
  const [stands, setStands] = useState<{ name: string; area: string }[]>([]);
  const [pickup, setPickup] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<{ discount: number; freeDelivery: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [limbo, setLimbo] = useState<{ reference: string; retrying: boolean } | null>(null);

  // Auth + empty-cart guards.
  useEffect(() => {
    if (!mounted) return;
    if (!token) router.replace("/login?next=/checkout");
    else if (items.length === 0 && !limbo) router.replace("/menu");
  }, [mounted, token, items.length, limbo, router]);

  // Load addresses + active stands.
  useEffect(() => {
    if (!token) return;
    api<Address[]>("/addresses", { token })
      .then((a) => {
        setAddresses(a);
        const def = a.find((x) => x.is_default) || a[0];
        if (def) setAddressId(def.id);
      })
      .catch(() => {});
    api<{ data: StandAnnouncement[] }>("/announcements/active")
      .then((r) => {
        const all = r.data.flatMap((x) => x.locations.map((l) => ({ name: l.name, area: l.area })));
        setStands(all);
        if (all.length) setPickup(all[0].name);
      })
      .catch(() => {});
  }, [token]);

  const deliveryFee = method === "HOME" ? (promo?.freeDelivery ? 0 : DELIVERY_FEE) : 0;
  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const res = await api<{ valid: boolean; discount_kobo?: number; free_delivery?: boolean; message: string }>(
        "/campaigns/validate",
        { method: "POST", body: JSON.stringify({ code: promoCode.trim(), subtotal_kobo: subtotal }) },
      );
      if (res.valid) {
        setPromo({ discount: res.discount_kobo ?? 0, freeDelivery: !!res.free_delivery });
        toast.success(res.message);
      } else {
        setPromo(null);
        toast.error(res.message);
      }
    } catch {
      toast.error("Could not validate promo code.");
    }
  }

  async function createOrder(paystackRef?: string) {
    let useAddressId = addressId;
    if (method === "HOME" && !useAddressId && newAddr.recipient) {
      const created = await api<Address>("/addresses", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ ...newAddr, is_default: true }),
      });
      useAddressId = created.id;
    }

    const payload: Record<string, unknown> = {
      items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      delivery_method: method,
      payment_method: method === "PICKUP" ? "CASH" : "MOMO",
      paystack_reference: paystackRef,
      promo_code: promoCode || undefined,
    };
    if (method === "HOME") payload.address_id = useAddressId;
    if (method === "PICKUP") payload.pickup_location_name = pickup;

    const order = await api<{ id: string; order_number: string }>("/orders", {
      method: "POST",
      token: token!,
      body: JSON.stringify(payload),
    });
    clear();
    setLimbo(null);
    router.push(`/checkout/success?order=${order.order_number}&id=${order.id}`);
  }

  async function placeOrder() {
    if (!token) return;
    setLoading(true);
    try {
      if (method === "PICKUP") {
        await createOrder();
        return;
      }
      const reference = `APH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      openPaystack({
        email: user?.email || `${user?.phone}@adepaporkhub.shop`,
        amountKobo: total,
        reference,
        metadata: { customer_id: user?.id },
        onSuccess: async (ref) => {
          try {
            await createOrder(ref);
          } catch {
            try {
              await new Promise((r) => setTimeout(r, 1500));
              await createOrder(ref);
            } catch {
              setLimbo({ reference: ref, retrying: false });
            }
          }
        },
        onClose: () => {
          setLoading(false);
          toast.info("Payment cancelled.");
        },
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  async function retryRecovery() {
    if (!limbo) return;
    setLimbo({ ...limbo, retrying: true });
    try {
      await createOrder(limbo.reference);
    } catch {
      setLimbo({ ...limbo, retrying: false });
      toast.error("Still could not save your order. Please contact us with your reference.");
    }
  }

  if (!mounted || !token) return null;

  // Post-payment recovery takeover.
  if (limbo) {
    const wa = encodeURIComponent(`Hi Adepa, my payment went through but my order didn't save. Reference: ${limbo.reference}.`);
    return (
      <div className="mx-auto grid min-h-[70svh] w-full max-w-lg place-items-center px-4 py-10">
        <div className="rounded-3xl border border-accent/40 bg-card p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold">Your payment went through</h1>
          <p className="mt-2 text-muted-foreground">
            We charged you successfully but couldn&apos;t save the order. <strong className="text-foreground">Your money is safe.</strong>{" "}
            Tap below to finish, or send us the reference on WhatsApp.
          </p>
          <div className="mt-5 rounded-xl bg-secondary px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</p>
            <p className="mt-1 select-all font-mono text-lg font-bold text-primary">{limbo.reference}</p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1 rounded-full" disabled={limbo.retrying} onClick={retryRecovery}>
              {limbo.retrying ? "Finishing…" : "Finish my order"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 rounded-full"
              render={<a href={`https://wa.me/${WHATSAPP}?text=${wa}`} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-4" /> WhatsApp us
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <span className="eyebrow">Almost there</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          {/* Delivery method */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { v: "HOME", icon: Truck, label: "Home delivery", desc: "Across Kumasi", price: "GHS 15" },
                { v: "PICKUP", icon: Store, label: "Stand pickup", desc: "Collect at a stand", price: "Free" },
              ] as const).map((m) => {
                const active = method === m.v;
                const Icon = m.icon;
                return (
                  <button
                    key={m.v}
                    onClick={() => setMethod(m.v)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1">
                      <span className="block font-semibold">{m.label}</span>
                      <span className="block text-xs text-muted-foreground">{m.desc}</span>
                    </span>
                    <span className={cn("text-sm font-bold", active ? "text-primary" : "text-foreground")}>{m.price}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Address / pickup */}
          {method === "HOME" ? (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery address</h2>
              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all",
                        addressId === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                      )}
                    >
                      <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-primary" />
                      <span>
                        <span className="block text-sm font-semibold">{a.label} · {a.recipient}</span>
                        <span className="block text-xs text-muted-foreground">{a.area}, {a.district} · {a.phone}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 rounded-2xl border-2 border-border p-4 sm:grid-cols-2">
                  <Field label="Recipient" value={newAddr.recipient} onChange={(v) => setNewAddr({ ...newAddr, recipient: v })} />
                  <Field label="Phone" value={newAddr.phone} onChange={(v) => setNewAddr({ ...newAddr, phone: v })} />
                  <Field label="Area" value={newAddr.area} onChange={(v) => setNewAddr({ ...newAddr, area: v })} />
                  <Field label="District" value={newAddr.district} onChange={(v) => setNewAddr({ ...newAddr, district: v })} />
                  <div className="sm:col-span-2">
                    <Field label="Landmark (optional)" value={newAddr.landmark} onChange={(v) => setNewAddr({ ...newAddr, landmark: v })} />
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup location</h2>
              {stands.length === 0 ? (
                <p className="rounded-2xl border-2 border-border p-4 text-sm text-muted-foreground">
                  No active stands this week. Choose home delivery instead.
                </p>
              ) : (
                <div className="space-y-2">
                  {stands.map((s) => (
                    <label
                      key={s.name}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all",
                        pickup === s.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                      )}
                    >
                      <input type="radio" checked={pickup === s.name} onChange={() => setPickup(s.name)} className="accent-primary" />
                      <span className="text-sm font-semibold">{s.name} <span className="font-normal text-muted-foreground">— {s.area}</span></span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Promo */}
          <section>
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="size-3.5" /> Promo code
            </h2>
            <div className="flex gap-2">
              <Input placeholder="WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
              <Button variant="outline" className="rounded-full" onClick={applyPromo}>Apply</Button>
            </div>
            {promo && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Check className="size-3.5" /> Promo applied
              </p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Your order</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.product.id} className="flex justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {i.product.name} × {i.quantity}
                  </span>
                  <span className="tabular-nums">{formatGhs(i.product.price_kobo * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatGhs(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{deliveryFee === 0 ? "Free" : formatGhs(deliveryFee)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-primary"><dt>Discount</dt><dd className="tabular-nums">− {formatGhs(discount)}</dd></div>}
            </dl>
            <div className="mt-4 flex items-end justify-between rounded-2xl bg-foreground px-5 py-4 text-background">
              <span className="text-xs uppercase tracking-wider text-background/60">Total</span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">{formatGhs(total)}</span>
            </div>
            <Button size="lg" className="mt-4 w-full rounded-full" disabled={loading} onClick={placeOrder}>
              <CreditCard className="size-4" />
              {method === "PICKUP" ? "Place order" : `Pay ${formatGhs(total)}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" /> Secure payment via Paystack
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
