import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatGhs, formatDateTime, formatWeight } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'

export default function SaleReceipt() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!order) return <p className="p-8 text-center">Receipt not found.</p>

  return (
    <>
      {/* Print-only styles — these override the layout chrome when printing */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
          @page { size: 80mm auto; margin: 4mm; }
        }
        @media print and (min-width: 100mm) {
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="space-y-4">
        <div className="flex items-center justify-between no-print">
          <Link to="/employee/history" className="inline-flex items-center gap-1 text-sm font-medium text-night-600 hover:text-flame">
            <ArrowLeft className="h-4 w-4" /> Back to sales history
          </Link>
          <Button onClick={() => window.print()} variant="primary">
            <Printer className="h-4 w-4" /> Print receipt
          </Button>
        </div>

        <div className="no-print rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
          <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Sale recorded successfully
          </p>
          <p className="mt-0.5 text-xs text-green-700">Hand this receipt to the customer or print it from the button above.</p>
        </div>

        {/* Receipt body — what gets printed */}
        <div className="print-area mx-auto max-w-md bg-white p-8 shadow-sm ring-1 ring-night-100" id="receipt">
          {/* Brand header */}
          <header className="border-b border-dashed border-night-300 pb-4 text-center">
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-lg bg-flame text-2xl font-bold text-white">A</div>
            <h1 className="display text-xl font-bold text-night-900">Adepa Pork Hub</h1>
            <p className="text-xs text-night-600">Fresh. Spiced. Ready for Every Meal.</p>
            <p className="mt-1 text-xs text-night-500">Accra, Ghana • orders@adepaporkhub.shop</p>
          </header>

          {/* Meta */}
          <section className="mt-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-night-500">Receipt #</span>
              <span className="font-mono font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-night-500">Date</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-night-500">Served by</span>
              <span>{user?.name} ({user?.employee_id})</span>
            </div>
            {order.pickup_location_name && (
              <div className="flex justify-between">
                <span className="text-night-500">Location</span>
                <span>{order.pickup_location_name}</span>
              </div>
            )}
            {order.customer?.name && (
              <div className="flex justify-between">
                <span className="text-night-500">Customer</span>
                <span>{order.customer.name}</span>
              </div>
            )}
          </section>

          {/* Items */}
          <section className="mt-4 border-t border-dashed border-night-300 pt-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-night-500">Items</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-night-200 text-left text-night-500">
                  <th className="pb-1 font-medium">Item</th>
                  <th className="pb-1 text-center font-medium">Qty</th>
                  <th className="pb-1 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it) => (
                  <tr key={it.id} className="align-top">
                    <td className="py-1.5">
                      <p className="font-medium text-night-900">{it.product_name}</p>
                      <p className="text-[10px] text-night-500">
                        {it.product_variant && it.product_variant !== 'NONE' ? it.product_variant : ''}
                        {it.weight_grams ? ` • ${formatWeight(it.weight_grams)}` : ''}
                        {' • '}
                        {formatGhs(it.unit_price_kobo)} each
                      </p>
                    </td>
                    <td className="py-1.5 text-center">{it.quantity}</td>
                    <td className="py-1.5 text-right font-semibold">{formatGhs(it.subtotal_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="mt-3 space-y-1 border-t border-dashed border-night-300 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-night-500">Subtotal</span>
              <span>{formatGhs(order.subtotal_kobo)}</span>
            </div>
            {order.delivery_fee_kobo > 0 && (
              <div className="flex justify-between">
                <span className="text-night-500">Delivery</span>
                <span>{formatGhs(order.delivery_fee_kobo)}</span>
              </div>
            )}
            {order.discount_kobo > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>− {formatGhs(order.discount_kobo)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-night-300 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-flame">{formatGhs(order.total_kobo)}</span>
            </div>
          </section>

          {/* Payment */}
          <section className="mt-3 border-t border-dashed border-night-300 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-night-500">Payment</span>
              <span className="font-semibold">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-night-500">Status</span>
              <span className={`font-semibold ${order.payment_status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>
                {order.payment_status}
              </span>
            </div>
            {order.paystack_reference && (
              <div className="flex justify-between">
                <span className="text-night-500">Reference</span>
                <span className="font-mono">{order.paystack_reference}</span>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="mt-5 border-t border-dashed border-night-300 pt-4 text-center text-xs text-night-500">
            <p className="font-semibold text-night-800">Thank you for choosing Adepa Pork Hub!</p>
            <p className="mt-1">Find us at adepaporkhub.shop</p>
            <p className="mt-3 text-[10px] text-night-400">Keep this receipt for any returns or queries.</p>
          </footer>
        </div>
      </div>
    </>
  )
}
