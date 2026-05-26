import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/axios'
import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatGhs } from '@/lib/formatters'
import { toast } from 'sonner'

interface Line { product_id: string; quantity: number }

export default function RecordSale() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentReference, setPaymentReference] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [standName, setStandName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data.data))
  }, [])

  function addLine() {
    if (products.length === 0) return
    setLines([...lines, { product_id: products[0].id, quantity: 1 }])
  }
  function setLine(i: number, key: keyof Line, value: any) {
    const next = [...lines]; (next[i] as any)[key] = value; setLines(next)
  }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)) }

  const total = useMemo(() => {
    return lines.reduce((s, l) => {
      const p = products.find((x) => x.id === l.product_id)
      return s + (p ? p.price_kobo * l.quantity : 0)
    }, 0)
  }, [lines, products])

  async function submit() {
    if (lines.length === 0) { toast.error('Add at least one line.'); return }
    setLoading(true)
    try {
      const r = await api.post('/orders/employee-sale', {
        items: lines,
        customer_phone: customerPhone || undefined,
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        promo_code: promoCode || undefined,
        stand_name: standName || undefined,
      })
      toast.success(`Sale ${r.data.order_number} recorded.`)
      navigate(`/employee/sale/${r.data.id}/receipt`)
    } catch { /* */ } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold">Record a sale</h1>

      <div className="card space-y-4">
        <Input label="Customer phone (optional — leave blank for walk-in)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        <Input label="Stand / location" placeholder="e.g. Accra Central Stand" value={standName} onChange={(e) => setStandName(e.target.value)} />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items</h2>
          <Button variant="outline" onClick={addLine} size="sm"><Plus className="h-4 w-4" /> Add line</Button>
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-night-500">Click "Add line" to start.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((l, i) => {
              const p = products.find((x) => x.id === l.product_id)
              return (
                <div key={i} className="flex items-end gap-2 rounded-xl bg-cream p-3">
                  <Select
                    label="Product"
                    value={l.product_id}
                    onChange={(e) => setLine(i, 'product_id', e.target.value)}
                    className="flex-1"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.weight_grams ? `(${p.weight_grams >= 1000 ? p.weight_grams / 1000 + 'kg' : p.weight_grams + 'g'})` : ''} — {formatGhs(p.price_kobo)}
                      </option>
                    ))}
                  </Select>
                  <Input label="Qty" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, 'quantity', Number(e.target.value))} className="w-24" />
                  <div className="w-28 pb-2 text-right font-semibold">{p && formatGhs(p.price_kobo * l.quantity)}</div>
                  <button onClick={() => removeLine(i)} className="rounded-md p-2 text-flame hover:bg-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card grid gap-3 sm:grid-cols-2">
        <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="CASH">Cash</option>
          <option value="MOMO">Mobile Money</option>
          <option value="CARD">Card</option>
        </Select>
        {paymentMethod !== 'CASH' && (
          <Input label="Reference / Txn ID" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
        )}
        <Input label="Promo code (optional)" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
      </div>

      <div className="card flex items-center justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-3xl font-bold text-flame">{formatGhs(total)}</span>
      </div>

      <Button onClick={submit} loading={loading} className="w-full" size="lg">Submit sale</Button>
    </div>
  )
}
