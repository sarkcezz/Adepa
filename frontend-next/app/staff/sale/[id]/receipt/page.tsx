"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatWeight } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const mounted = useHasMounted();
  const token = useAuth((s) => s.token);
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Order>(`/orders/${id}`, { token }).then(setOrder).catch(() => {});
  }, [token, id]);

  if (!mounted || !token) return null;

  return (
    <div className="min-h-svh bg-secondary/30 px-4 py-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: 80mm auto; margin: 4mm; }
          .receipt { box-shadow: none !important; border: none !important; width: 72mm !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-md items-center justify-between">
        <Link href="/staff/history" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> History
        </Link>
        <Button className="rounded-full" onClick={() => window.print()}>
          <Printer className="size-4" /> Print
        </Button>
      </div>

      {order?.payment_status === "PAID" && (
        <div className="no-print mx-auto mb-4 flex max-w-md items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="size-5" /> Sale recorded successfully.
        </div>
      )}

      {/* Receipt */}
      <div className="receipt mx-auto max-w-md rounded-2xl border border-border/60 bg-white p-6 text-sm text-neutral-900 shadow-sm">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold">Adepa Pork Hub</p>
          <p className="mt-0.5 text-[11px] text-neutral-500">Ejisu-Krapa, Ashanti · orders@adepaporkhub.shop</p>
        </div>

        <div className="my-4 border-t border-dashed border-neutral-300" />

        {order ? (
          <>
            <div className="space-y-1 text-[11px] text-neutral-600">
              <Row label="Receipt #" value={order.order_number} mono />
              <Row label="Date" value={new Date(order.created_at).toLocaleString("en-GB")} />
              {user && <Row label="Served by" value={`${user.name} (${user.employee_id})`} />}
              {order.pickup_location_name && <Row label="Stand" value={order.pickup_location_name} />}
            </div>

            <div className="my-4 border-t border-dashed border-neutral-300" />

            <table className="w-full text-[12px]">
              <tbody>
                {order.items?.map((it) => (
                  <tr key={it.id} className="align-top">
                    <td className="py-1">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-[10px] text-neutral-500">
                        {it.quantity} × {formatGhs(it.unit_price_kobo)}
                        {it.weight_grams ? ` · ${formatWeight(it.weight_grams)}` : ""}
                      </p>
                    </td>
                    <td className="py-1 text-right font-semibold">{formatGhs(it.subtotal_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="my-3 border-t border-dashed border-neutral-300" />

            <div className="space-y-1 text-[12px]">
              <Row label="Subtotal" value={formatGhs(order.subtotal_kobo)} />
              {order.discount_kobo > 0 && <Row label="Discount" value={`− ${formatGhs(order.discount_kobo)}`} />}
              <div className="mt-1 flex justify-between border-t border-neutral-300 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatGhs(order.total_kobo)}</span>
              </div>
              <Row label="Payment" value={`${order.payment_method} (${order.payment_status})`} />
            </div>

            <div className="my-4 border-t border-dashed border-neutral-300" />
            <p className="text-center text-[11px] text-neutral-500">Thank you for choosing Adepa Pork Hub!</p>
            <p className="text-center text-[10px] text-neutral-400">adepaporkhub.shop</p>
          </>
        ) : (
          <p className="py-8 text-center text-neutral-400">Loading receipt…</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}
