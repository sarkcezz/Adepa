"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, MapPin, Banknote, Smartphone, CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatWeight, PRODUCT_LINE_LABEL } from "@/lib/format";
import type { Product, Paginated, ProductLine } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Line = { product: Product; qty: number };
type Pay = "CASH" | "MOMO" | "CARD";
const LINES: (ProductLine | "ALL")[] = ["ALL", "RAW", "SPICED", "READY_TO_EAT"];
const STAND_KEY = "adepa-pos-stand";

export default function PosPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [cart, setCart] = useState<Line[]>([]);
  const [pay, setPay] = useState<Pay>("CASH");
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [stand, setStand] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return (products ?? []).filter((p) => {
      if (filter !== "ALL" && p.product_line !== filter) return false;
      if (!s) return p.stock_qty !== 0 || true;
      return p.name.toLowerCase().includes(s) || p.product_line.toLowerCase().includes(s);
    });
  }, [products, search, filter]);

  const total = cart.reduce((n, l) => n + l.product.price_kobo * l.qty, 0);
  const qtyOf = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0;

  function addToCart(p: Product) {
    if (p.stock_qty === 0) return;
    setCart((c) => {
      const ex = c.find((l) => l.product.id === p.id);
      if (ex) return c.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { product: p, qty: 1 }];
    });
  }
  const inc = (id: string) => setCart((c) => c.map((l) => (l.product.id === id ? { ...l, qty: l.qty + 1 } : l)));
  const dec = (id: string) => setCart((c) => c.flatMap((l) => (l.product.id === id ? (l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }]) : [l])));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.product.id !== id));

  async function complete() {
    if (cart.length === 0) return toast.error("Cart is empty.");
    if (pay !== "CASH" && !ref.trim()) return toast.error(`Enter the ${pay} reference.`);
    setSubmitting(true);
    try {
      const order = await api<{ id: string; order_number: string }>("/orders/employee-sale", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          items: cart.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
          payment_method: pay,
          payment_reference: ref || undefined,
          customer_phone: phone || undefined,
          stand_name: stand || undefined,
        }),
      });
      toast.success(`Sale ${order.order_number} recorded.`);
      router.push(`/staff/sale/${order.id}/receipt`);
    } catch {
      toast.error("Could not record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !token) return null;

  return (
    <div className="mx-auto flex h-[calc(100svh-5rem)] w-full max-w-screen-2xl flex-col gap-4 lg:flex-row">
      {/* Products */}
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <input value={stand} onChange={(e) => setStand(e.target.value)} placeholder="Stand / location" className="w-32 bg-transparent outline-none sm:w-44" />
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
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
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs font-semibold text-destructive">Clear</button>
          )}
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div><ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground/40" />Tap a product to start.</div>
            </div>
          ) : (
            cart.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 rounded-xl border border-border/60 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.product.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatGhs(l.product.price_kobo)} ea</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-secondary">
                  <button onClick={() => dec(l.product.id)} className="grid size-7 place-items-center rounded-full hover:bg-muted"><Minus className="size-3.5" /></button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                  <button onClick={() => inc(l.product.id)} className="grid size-7 place-items-center rounded-full hover:bg-muted"><Plus className="size-3.5" /></button>
                </div>
                <span className="w-16 text-right text-sm font-bold tabular-nums">{formatGhs(l.product.price_kobo * l.qty)}</span>
                <button onClick={() => removeLine(l.product.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary tabular-nums">{formatGhs(total)}</span>
          </div>

          <Input placeholder="Customer phone (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

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
            {cart.length === 0 ? "Add items" : `Complete sale · ${formatGhs(total)}`}
          </Button>
        </div>
      </aside>
    </div>
  );
}
