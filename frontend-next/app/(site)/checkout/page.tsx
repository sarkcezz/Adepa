"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Store, Tag, Banknote, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useCart, cartSubtotal, useHasMounted } from "@/lib/cart-store";
import { formatGhs } from "@/lib/format";
import type { Address, StandAnnouncement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Method = "HOME" | "PICKUP";

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
  const [guest, setGuest] = useState({ name: "", phone: "", email: "" });
  const [stands, setStands] = useState<{ name: string; area: string }[]>([]);
  const [pickup, setPickup] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<{ discount: number; freeDelivery: boolean } | null>(null);
  const [giftCode, setGiftCode] = useState("");
  const [giftCard, setGiftCard] = useState<{ balance_kobo: number } | null>(null);
  const [loyalty, setLoyalty] = useState<{ balance: number; redeemable_kobo: number } | null>(null);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryFeeKobo, setDeliveryFeeKobo] = useState(1500);
  const orderPlaced = useRef(false);

  // Empty-cart guard only — checkout supports guest checkout, so no auth redirect.
  // Skipped once an order is placed: clearing the cart on success shouldn't
  // race the redirect to /checkout/success and bounce back to /menu instead.
  useEffect(() => {
    if (!mounted || orderPlaced.current) return;
    if (items.length === 0) router.replace("/menu");
  }, [mounted, items.length, router]);

  // Load addresses + active stands.
  useEffect(() => {
    if (!token) return;
    api<{ data: Address[] }>("/addresses", { token })
      .then((r) => {
        const a = r.data;
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
    api<{ balance: number; redeemable_kobo: number }>("/account/loyalty", { token })
      .then(setLoyalty)
      .catch(() => {});
  }, [token]);

  // Live shipping estimate — recalculates as the delivery address or cart changes.
  useEffect(() => {
    if (method !== "HOME" || items.length === 0) return;
    const selectedAddr = addresses.find((a) => a.id === addressId);
    const district = selectedAddr?.district || newAddr.district;
    api<{ fee_kobo: number }>("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify({ district, items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })) }),
    })
      .then((r) => setDeliveryFeeKobo(r.fee_kobo))
      .catch(() => {});
  }, [method, items, addressId, addresses, newAddr.district]);

  const deliveryFee = method === "HOME" ? (promo?.freeDelivery ? 0 : deliveryFeeKobo) : 0;
  const discount = promo?.discount ?? 0;
  const preLoyaltyTotal = Math.max(0, subtotal + deliveryFee - discount);
  const redeemablePoints = loyalty ? Math.min(loyalty.balance, Math.floor(preLoyaltyTotal / 10)) : 0;
  const loyaltyKobo = useLoyalty ? redeemablePoints * 10 : 0;
  const preGiftCardTotal = Math.max(0, preLoyaltyTotal - loyaltyKobo);
  const giftCardKobo = giftCard ? Math.min(giftCard.balance_kobo, preGiftCardTotal) : 0;
  const total = Math.max(0, preGiftCardTotal - giftCardKobo);

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

  async function applyGiftCard() {
    if (!giftCode.trim()) return;
    try {
      const res = await api<{ valid: boolean; balance_kobo?: number; message: string }>(
        "/gift-cards/validate",
        { method: "POST", body: JSON.stringify({ code: giftCode.trim() }) },
      );
      if (res.valid) {
        setGiftCard({ balance_kobo: res.balance_kobo ?? 0 });
        toast.success(res.message);
      } else {
        setGiftCard(null);
        toast.error(res.message);
      }
    } catch {
      toast.error("Could not validate gift card.");
    }
  }

  async function createOrder() {
    const payload: Record<string, unknown> = {
      items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      delivery_method: method,
      payment_method: "CASH",
      promo_code: promoCode || undefined,
      redeem_points: useLoyalty && redeemablePoints > 0 ? redeemablePoints : undefined,
      gift_card_code: giftCard ? giftCode.trim() : undefined,
    };
    if (method === "HOME") {
      if (addressId) payload.address_id = addressId;
      else payload.new_address = newAddr;
    }
    if (method === "PICKUP") payload.pickup_location_name = pickup;
    if (!token) {
      payload.guest_name = guest.name;
      payload.guest_phone = guest.phone;
      payload.guest_email = guest.email || undefined;
    }

    const order = await api<{ id: string; order_number: string }>("/orders", {
      method: "POST",
      token: token || undefined,
      body: JSON.stringify(payload),
    });
    orderPlaced.current = true;
    clear();
    router.push(`/checkout/success?order=${order.order_number}&id=${order.id}`);
  }

  function validateGuestFields(): boolean {
    if (token) return true;
    if (!guest.name.trim() || !guest.phone.trim()) {
      toast.error("Enter your name and phone number to check out as a guest.");
      return false;
    }
    return true;
  }

  async function placeOrder() {
    if (!validateGuestFields()) return;
    setLoading(true);
    try {
      await createOrder();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="eyebrow">Almost there</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          {/* Contact details — guest checkout or signed-in */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact details</h2>
              {!token && (
                <button
                  type="button"
                  onClick={() => router.push("/login?next=/checkout")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Sign in instead
                </button>
              )}
            </div>
            {token ? (
              <p className="rounded-2xl border-2 border-border p-4 text-sm">
                <span className="font-semibold">{user?.name}</span>{" "}
                <span className="text-muted-foreground">· {user?.email || user?.phone}</span>
              </p>
            ) : (
              <div className="grid gap-3 rounded-2xl border-2 border-border p-4 sm:grid-cols-2">
                <Field label="Full name" value={guest.name} onChange={(v) => setGuest({ ...guest, name: v })} />
                <Field label="Phone" value={guest.phone} onChange={(v) => setGuest({ ...guest, phone: v })} />
                <div className="sm:col-span-2">
                  <Field label="Email (optional)" value={guest.email} onChange={(v) => setGuest({ ...guest, email: v })} />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Checking out as a guest — no account needed. Want order tracking and a saved address next time?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">Create an account</Link> instead.
                </p>
              </div>
            )}
          </section>

          {/* Delivery method */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { v: "HOME", icon: Truck, label: "Home delivery", desc: "Across Kumasi", price: `From ${formatGhs(deliveryFeeKobo)}` },
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
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated delivery fee: <span className="font-semibold text-foreground">{formatGhs(deliveryFeeKobo)}</span> — based on your district and order weight.
              </p>
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

          {/* Payment method */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment method</h2>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-4">
              <Banknote className="size-5 text-primary" />
              <span>
                <span className="block text-sm font-semibold">Cash {method === "PICKUP" ? "on pickup" : "on delivery"}</span>
                <span className="block text-xs text-muted-foreground">
                  Online payment isn&apos;t available yet — pay in cash when your order {method === "PICKUP" ? "is collected" : "arrives"}.
                </span>
              </span>
            </div>
          </section>

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

          {/* Gift card */}
          <section>
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Gift className="size-3.5" /> Gift card
            </h2>
            <div className="flex gap-2">
              <Input placeholder="GIFT-XXXX-XXXX" value={giftCode} onChange={(e) => setGiftCode(e.target.value.toUpperCase())} />
              <Button variant="outline" className="rounded-full" onClick={applyGiftCard}>Apply</Button>
            </div>
            {giftCard && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Check className="size-3.5" /> {formatGhs(giftCard.balance_kobo)} available
              </p>
            )}
          </section>

          {/* Loyalty points */}
          {token && loyalty && loyalty.balance > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Gift className="size-3.5" /> Rewards
              </h2>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-border p-4 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={useLoyalty}
                    onChange={(e) => setUseLoyalty(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-semibold">
                    Use {redeemablePoints} of your {loyalty.balance} points
                  </span>
                </span>
                <span className="text-sm font-bold text-primary">− {formatGhs(redeemablePoints * 10)}</span>
              </label>
            </section>
          )}
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
              {loyaltyKobo > 0 && <div className="flex justify-between text-primary"><dt>Rewards points</dt><dd className="tabular-nums">− {formatGhs(loyaltyKobo)}</dd></div>}
              {giftCardKobo > 0 && <div className="flex justify-between text-primary"><dt>Gift card</dt><dd className="tabular-nums">− {formatGhs(giftCardKobo)}</dd></div>}
            </dl>
            <div className="mt-4 flex items-end justify-between rounded-2xl bg-foreground px-5 py-4 text-background">
              <span className="text-xs uppercase tracking-wider text-background/60">Total</span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">{formatGhs(total)}</span>
            </div>
            <Button size="lg" className="mt-4 w-full rounded-full" disabled={loading} onClick={placeOrder}>
              <Banknote className="size-4" />
              Place order
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" />
              {method === "PICKUP" ? "Pay cash when you collect your order" : "Pay cash on delivery"}
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
