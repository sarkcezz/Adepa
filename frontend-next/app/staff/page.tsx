"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, MapPin, Banknote, Smartphone, CreditCard,
  ShoppingBag, ScanLine, Pause, Tag, User as UserIcon, X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL } from "@/lib/format";
import type { Product, Paginated, ProductLine, User } from "@/lib/types";
import type { PayMethod, SalePayload } from "@/lib/pos-types";
import { useOfflineQueue } from "@/lib/use-offline-queue";
import { useHeldCarts } from "@/lib/use-held-carts";
import { useBarcodeScanner } from "@/lib/use-barcode";
import { BarcodeScannerDialog } from "@/components/staff/barcode-scanner-dialog";
import { LineDiscountDialog } from "@/components/staff/line-discount-dialog";
import { HeldCartsDrawer } from "@/components/staff/held-carts-drawer";
import { OfflineBanner } from "@/components/staff/offline-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Line = { product: Product; qty: number; discountKobo: number };
const LINES: (ProductLine | "ALL")[] = ["ALL", "RAW", "SPICED", "READY_TO_EAT"];
const STAND_KEY = "adepa-pos-stand";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "r-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function PosPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [cart, setCart] = useState<Line[]>([]);
  const [pay, setPay] = useState<PayMethod>("CASH");
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Pick<User, "id" | "name"> | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [stand, setStand] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const [discountFor, setDiscountFor] = useState<string | null>(null);

  const { online, pending, enqueue, flush } = useOfflineQueue(token);
  const { carts: heldCarts, hold, resume, discard, count: heldCount } = useHeldCarts();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of the client-only localStorage source.
    if (mounted) setStand(localStorage.getItem(STAND_KEY) || "");
  }, [mounted]);
  useEffect(() => {
    if (stand) localStorage.setItem(STAND_KEY, stand);
  }, [stand]);

  useEffect(() => {
    if (!token) return;
    api<Paginated<Product>>("/products?active_only=1", { token })
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]));
  }, [token]);

  // Debounced customer lookup by phone.
  useEffect(() => {
    const p = phone.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the stale match immediately when the phone/token inputs change, before the debounced lookup below resolves a new one.
    setCustomer(null);
    if (p.length < 6 || !token) return;
    setLookingUp(true);
    const t = setTimeout(() => {
      api<{ customer: Pick<User, "id" | "name"> | null }>(
        `/orders/customer-lookup?phone=${encodeURIComponent(p)}`,
        { token },
      )
        .then((r) => setCustomer(r.customer))
        .catch(() => setCustomer(null))
        .finally(() => setLookingUp(false));
    }, 400);
    return () => clearTimeout(t);
  }, [phone, token]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return (products ?? []).filter((p) => {
      if (filter !== "ALL" && p.product_line !== filter) return false;
      if (!s) return true;
      return p.name.toLowerCase().includes(s) || p.product_line.toLowerCase().includes(s);
    });
  }, [products, search, filter]);

  const lineGross = (l: Line) => l.product.price_kobo * l.qty;
  const total = cart.reduce((n, l) => n + Math.max(0, lineGross(l) - l.discountKobo), 0);
  const discountTotal = cart.reduce((n, l) => n + l.discountKobo, 0);
  const qtyOf = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0;

  const addToCart = useCallback((p: Product) => {
    if (p.stock_qty === 0) return;
    setCart((c) => {
      const ex = c.find((l) => l.product.id === p.id);
      if (ex) return c.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { product: p, qty: 1, discountKobo: 0 }];
    });
  }, []);
  const inc = (id: string) => setCart((c) => c.map((l) => (l.product.id === id ? { ...l, qty: l.qty + 1 } : l)));
  const dec = (id: string) => setCart((c) => c.flatMap((l) => (l.product.id === id ? (l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }]) : [l])));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.product.id !== id));
  const setDiscount = (id: string, kobo: number) =>
    setCart((c) => c.map((l) => (l.product.id === id ? { ...l, discountKobo: kobo } : l)));

  // Barcode: match scanned code to a product by id or name (no SKU column).
  // useBarcodeScanner keeps its own ref to the latest onScan internally, so
  // handleScan's identity is free to change with `products` — no manual ref needed.
  const handleScan = useCallback(
    (code: string) => {
      const list = products ?? [];
      const lower = code.toLowerCase().trim();
      const match =
        list.find((p) => p.id === code) ||
        list.find((p) => p.name.toLowerCase() === lower) ||
        list.find((p) => p.name.toLowerCase().includes(lower));
      if (match) {
        addToCart(match);
        toast.success(`Added ${match.name}`);
      } else {
        toast.error(`No product matches "${code}"`);
      }
    },
    [products, addToCart],
  );
  useBarcodeScanner({ onScan: handleScan, enabled: !scannerOpen && !discountFor });

  function resetSale() {
    setCart([]);
    setPay("CASH");
    setRef("");
    setPhone("");
    setCustomer(null);
  }

  function buildPayload(clientRef?: string): SalePayload {
    return {
      items: cart.map((l) => ({
        product_id: l.product.id,
        quantity: l.qty,
        line_discount_kobo: l.discountKobo || undefined,
      })),
      payment_method: pay,
      payment_reference: ref || undefined,
      customer_id: customer?.id,
      customer_phone: phone.trim() || undefined,
      stand_name: stand || undefined,
      client_reference: clientRef,
    };
  }

  function holdCart() {
    if (cart.length === 0) return;
    hold({
      items: cart.map((l) => ({
        product_id: l.product.id,
        quantity: l.qty,
        line_discount_kobo: l.discountKobo || undefined,
      })),
      customer_phone: phone.trim() || undefined,
      customer_name: customer?.name,
      payment_method: pay,
      payment_reference: ref || undefined,
      stand_name: stand || undefined,
    });
    toast.success("Cart held.");
    resetSale();
  }

  function resumeCart(id: string) {
    const held = resume(id);
    if (!held) return;
    const list = products ?? [];
    const lines: Line[] = held.items
      .map((i) => {
        const product = list.find((p) => p.id === i.product_id);
        return product ? { product, qty: i.quantity, discountKobo: i.line_discount_kobo ?? 0 } : null;
      })
      .filter((l): l is Line => l !== null);
    setCart(lines);
    setPay(held.payment_method);
    setRef(held.payment_reference || "");
    setPhone(held.customer_phone || "");
    setHoldsOpen(false);
    toast.success("Cart resumed.");
  }

  async function complete() {
    if (cart.length === 0) return toast.error("Cart is empty.");
    if (pay !== "CASH" && !ref.trim()) return toast.error(`Enter the ${pay} reference.`);
    setSubmitting(true);

    // Offline → queue immediately.
    if (!online) {
      await enqueue(buildPayload());
      toast.success("Saved offline — will sync when you reconnect.");
      resetSale();
      setSubmitting(false);
      return;
    }

    const clientRef = uuid();
    try {
      const order = await api<{ id: string; order_number: string }>("/orders/employee-sale", {
        method: "POST",
        token: token!,
        body: JSON.stringify(buildPayload(clientRef)),
      });
      toast.success(`Sale ${order.order_number} recorded.`);
      resetSale();
      router.push(`/staff/sale/${order.id}/receipt`);
    } catch (e) {
      if (e instanceof ApiError) {
        // Server rejected it (validation / stock) — surface, don't queue.
        toast.error(e.message || "Could not record sale.");
      } else {
        // Network dropped mid-request — queue with the same reference so a
        // server-side success can't duplicate on replay.
        await enqueue(buildPayload(clientRef));
        toast.success("Connection lost — sale saved and will sync shortly.");
        resetSale();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !token) return null;

  const discountLine = discountFor ? cart.find((l) => l.product.id === discountFor) : null;

  return (
    <div className="mx-auto flex h-[calc(100svh-5rem)] w-full max-w-screen-2xl flex-col gap-4 lg:flex-row">
      {/* Products */}
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <OfflineBanner online={online} pending={pending} onFlush={flush} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <input value={stand} onChange={(e) => setStand(e.target.value)} placeholder="Stand / location" className="w-32 bg-transparent outline-none sm:w-44" />
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => setScannerOpen(true)}>
            <ScanLine className="size-4" /> Scan
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setHoldsOpen(true)}>
            <Pause className="size-4" /> Holds
            {heldCount > 0 && (
              <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {heldCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LINES.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === l ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
              )}
            >
              {l === "ALL" ? "All" : PRODUCT_LINE_LABEL[l]}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {products === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((p) => {
                const q = qtyOf(p.id);
                const out = p.stock_qty === 0;
                return (
                  <button
                    key={p.id}
                    disabled={out}
                    onClick={() => addToCart(p)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98] disabled:opacity-40"
                  >
                    <div className="relative aspect-square bg-secondary/40">
                      <div className="grid h-full place-items-center font-[family-name:var(--font-display)] text-sm font-bold text-primary/25">Adepa</div>
                      {q > 0 && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{q}</span>}
                      {out && <span className="absolute inset-0 grid place-items-center bg-foreground/55 text-[10px] font-bold uppercase text-background">Out</span>}
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatWeight(p.weight_grams)}</p>
                      <p className="font-[family-name:var(--font-display)] text-base font-bold text-primary">{formatGhs(p.price_kobo)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Cart */}
      <aside className="flex shrink-0 flex-col rounded-3xl border border-border/60 bg-card p-4 lg:w-[380px]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold">
            <ShoppingBag className="size-4 text-primary" /> Cart
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{cart.length}</span>
          </h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button onClick={holdCart} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Pause className="size-3.5" /> Hold
              </button>
            )}
            {cart.length > 0 && (
              <button onClick={resetSale} className="text-xs font-semibold text-destructive">Clear</button>
            )}
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div><ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground/40" />Tap or scan a product to start.</div>
            </div>
          ) : (
            cart.map((l) => {
              const net = Math.max(0, lineGross(l) - l.discountKobo);
              return (
                <div key={l.product.id} className="rounded-xl border border-border/60 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.product.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatGhs(l.product.price_kobo)} ea</p>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-secondary">
                      <button onClick={() => dec(l.product.id)} className="grid size-7 place-items-center rounded-full hover:bg-muted"><Minus className="size-3.5" /></button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                      <button onClick={() => inc(l.product.id)} className="grid size-7 place-items-center rounded-full hover:bg-muted"><Plus className="size-3.5" /></button>
                    </div>
                    <button onClick={() => removeLine(l.product.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <button
                      onClick={() => setDiscountFor(l.product.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        l.discountKobo > 0 ? "bg-accent/15 text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Tag className="size-3" />
                      {l.discountKobo > 0 ? `−${formatGhs(l.discountKobo)}` : "Discount"}
                    </button>
                    <span className="text-sm font-bold tabular-nums">
                      {l.discountKobo > 0 && (
                        <span className="mr-1.5 text-[11px] font-normal text-muted-foreground line-through">{formatGhs(lineGross(l))}</span>
                      )}
                      {formatGhs(net)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
          {discountTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Discounts</span>
              <span className="font-semibold text-destructive tabular-nums">−{formatGhs(discountTotal)}</span>
            </div>
          )}
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary tabular-nums">{formatGhs(total)}</span>
          </div>

          <div className="relative">
            <Input placeholder="Customer phone (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pr-8" />
            {phone && (
              <button onClick={() => setPhone("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          {lookingUp && <p className="text-[11px] text-muted-foreground">Looking up customer…</p>}
          {customer && (
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
              <UserIcon className="size-3.5" /> {customer.name} — existing customer
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {([["CASH", Banknote, "Cash"], ["MOMO", Smartphone, "MoMo"], ["CARD", CreditCard, "Card"]] as const).map(([v, Icon, label]) => (
              <button
                key={v}
                onClick={() => setPay(v)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition-all",
                  pay === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          {pay !== "CASH" && (
            <Input placeholder={`${pay} reference`} value={ref} onChange={(e) => setRef(e.target.value)} />
          )}

          <Button size="lg" className="w-full rounded-full" disabled={cart.length === 0 || submitting} onClick={complete}>
            {cart.length === 0 ? "Add items" : online ? `Complete sale · ${formatGhs(total)}` : `Save offline · ${formatGhs(total)}`}
          </Button>
        </div>
      </aside>

      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={handleScan} />
      <HeldCartsDrawer
        open={holdsOpen}
        onOpenChange={setHoldsOpen}
        carts={heldCarts}
        onResume={resumeCart}
        onDiscard={discard}
      />
      {discountLine && (
        <LineDiscountDialog
          open={!!discountFor}
          onOpenChange={(o) => !o && setDiscountFor(null)}
          productName={discountLine.product.name}
          lineGrossKobo={lineGross(discountLine)}
          currentKobo={discountLine.discountKobo}
          onApply={(kobo) => setDiscount(discountLine.product.id, kobo)}
        />
      )}
    </div>
  );
}
