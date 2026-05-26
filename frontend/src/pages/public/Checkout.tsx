import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Tag, Truck } from 'lucide-react'
import { api } from '@/lib/axios'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatGhs } from '@/lib/formatters'
import { openPaystack } from '@/lib/paystack'
import { toast } from 'sonner'
import type { Address, StandAnnouncement } from '@/types'

type Method = 'HOME' | 'PICKUP' | 'EVENT'

export default function Checkout() {
  const { items, subtotalKobo, clear } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [method, setMethod] = useState<Method>('HOME')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressId, setAddressId] = useState('')
  const [stands, setStands] = useState<{ name: string; area: string }[]>([])
  const [pickupName, setPickupName] = useState('')
  const [newAddress, setNewAddress] = useState({ label: 'Home', recipient: '', phone: '', area: '', district: '', landmark: '' })
  const [promoCode, setPromoCode] = useState('')
  const [promo, setPromo] = useState<{ discount: number; freeDelivery: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login?next=/checkout'); return }
    if (items.length === 0) { navigate('/products'); return }

    api.get('/addresses').then((r) => {
      setAddresses(r.data)
      const def = r.data.find((a: Address) => a.is_default) || r.data[0]
      if (def) setAddressId(def.id)
    })

    api.get('/announcements/active').then((r) => {
      const all = (r.data.data as StandAnnouncement[]).flatMap((a) => a.locations.map((l) => ({ name: l.name, area: l.area })))
      setStands(all)
      if (all.length) setPickupName(all[0].name)
    })
  }, [user, items.length, navigate])

  const subtotal = subtotalKobo()
  const deliveryFee = method === 'HOME' ? (promo?.freeDelivery ? 0 : 1500) : 0
  const discount = promo?.discount ?? 0
  const total = Math.max(0, subtotal + deliveryFee - discount)

  async function applyPromo() {
    if (!promoCode.trim()) return
    try {
      const res = await api.post('/campaigns/validate', { code: promoCode.trim(), subtotal_kobo: subtotal })
      if (res.data.valid) {
        setPromo({ discount: res.data.discount_kobo ?? 0, freeDelivery: !!res.data.free_delivery, message: res.data.message })
        toast.success(res.data.message)
      } else {
        setPromo(null)
        toast.error(res.data.message)
      }
    } catch {
      toast.error('Could not validate promo code.')
    }
  }

  async function placeOrder() {
    if (!user) return
    setLoading(true)

    try {
      // Ensure a saved address for HOME delivery
      let useAddressId = addressId
      if (method === 'HOME' && !useAddressId && newAddress.recipient) {
        const res = await api.post('/addresses', { ...newAddress, is_default: true })
        useAddressId = res.data.id
      }

      const reference = `APH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()

      const finalize = async (paystackRef?: string) => {
        const payload: any = {
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          delivery_method: method,
          payment_method: method === 'PICKUP' ? 'CASH' : 'MOMO',
          paystack_reference: paystackRef,
          promo_code: promoCode || undefined,
        }
        if (method === 'HOME') payload.address_id = useAddressId
        if (method === 'PICKUP') payload.pickup_location_name = pickupName

        const r = await api.post('/orders', payload)
        clear()
        toast.success(`Order ${r.data.order_number} placed!`)
        navigate(`/dashboard/orders/${r.data.id}/track`)
      }

      if (method === 'PICKUP') {
        await finalize()
      } else {
        openPaystack({
          email: user.email || `${user.phone}@adepaporkhub.com`,
          amountKobo: total,
          reference,
          metadata: { customer_id: user.id },
          onSuccess: (ref) => finalize(ref).catch(() => toast.error('Order creation failed after payment.')),
          onClose: () => { setLoading(false); toast.info('Payment cancelled.') },
        })
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-tight py-10">
      <h1 className="display mb-8 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Delivery method */}
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Truck className="h-5 w-5 text-flame" /> Delivery method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: 'HOME',   label: 'Home Delivery', desc: 'Across Accra & Tema — GHS 15' },
                { value: 'PICKUP', label: 'Stand Pickup',  desc: 'Collect at a stand — free' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value as Method)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    method === m.value ? 'border-flame bg-flame/5 ring-2 ring-flame' : 'border-night-200 hover:border-night-300'
                  }`}
                >
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-xs text-night-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Address or pickup */}
          {method === 'HOME' && (
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-flame" /> Delivery address</h2>
              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${addressId === a.id ? 'border-flame bg-flame/5' : 'border-night-200'}`}>
                      <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-flame" />
                      <div>
                        <p className="text-sm font-semibold">{a.label} • {a.recipient}</p>
                        <p className="text-xs text-night-600">{a.area}, {a.district} • {a.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Recipient name" value={newAddress.recipient} onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })} />
                  <Input label="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  <Input label="Area" value={newAddress.area} onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} />
                  <Input label="District" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} />
                  <Input label="Landmark (optional)" className="sm:col-span-2" value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {method === 'PICKUP' && (
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-flame" /> Pickup location</h2>
              {stands.length === 0 ? (
                <p className="text-sm text-night-500">No active stands this week. Choose home delivery instead.</p>
              ) : (
                <select className="input" value={pickupName} onChange={(e) => setPickupName(e.target.value)}>
                  {stands.map((s) => <option key={s.name} value={s.name}>{s.name} — {s.area}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Promo code */}
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Tag className="h-5 w-5 text-flame" /> Promo code</h2>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
              <Button variant="outline" onClick={applyPromo}>Apply</Button>
            </div>
            {promo && (
              <p className="mt-2 text-xs font-medium text-green-700">✓ {promo.message}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="card h-fit lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          <ul className="mb-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product.id} className="flex justify-between gap-3">
                <span className="min-w-0 flex-1 truncate">{i.product.name} × {i.quantity}</span>
                <span className="font-medium">{formatGhs(i.product.price_kobo * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-night-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-night-500">Subtotal</span><span>{formatGhs(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-night-500">Delivery</span><span>{formatGhs(deliveryFee)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>− {formatGhs(discount)}</span></div>}
            <div className="flex justify-between border-t border-night-100 pt-2 text-base font-bold"><span>Total</span><span className="text-flame">{formatGhs(total)}</span></div>
          </div>
          <Button onClick={placeOrder} loading={loading} className="mt-5 w-full" size="lg">
            <CreditCard className="h-5 w-5" /> {method === 'PICKUP' ? 'Place order' : `Pay ${formatGhs(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-night-500">Secure payment via Paystack</p>
        </aside>
      </div>
    </div>
  )
}
