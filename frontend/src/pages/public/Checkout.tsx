import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Tag, Truck, Check, AlertTriangle, MessageCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatGhs } from '@/lib/formatters'
import { openPaystack } from '@/lib/paystack'
import { PorkMark } from '@/components/common/PorkMark'
import { toast } from 'sonner'
import type { Address, StandAnnouncement } from '@/types'

type Method = 'HOME' | 'PICKUP'

const WHATSAPP = '233500000000'

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

  // Post-payment recovery state. When Paystack charged the card but order
  // creation failed, we hold the reference here and show a recovery panel
  // instead of a disappearing toast — the customer's money is on the line.
  const [paymentLimbo, setPaymentLimbo] = useState<{ reference: string; retrying: boolean } | null>(null)

  useEffect(() => {
    if (!user) { navigate('/login?next=/checkout'); return }
    if (items.length === 0 && !paymentLimbo) { navigate('/products'); return }

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
  }, [user, items.length, navigate, paymentLimbo])

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

  // Builds and submits the order payload. Separated so the recovery panel
  // can re-call it with the same Paystack reference.
  async function createOrder(paystackRef?: string) {
    let useAddressId = addressId
    if (method === 'HOME' && !useAddressId && newAddress.recipient) {
      const res = await api.post('/addresses', { ...newAddress, is_default: true })
      useAddressId = res.data.id
    }

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
    setPaymentLimbo(null)
    toast.success(`Order ${r.data.order_number} placed!`)
    navigate(`/dashboard/orders/${r.data.id}/track`)
  }

  async function placeOrder() {
    if (!user) return
    setLoading(true)

    try {
      if (method === 'PICKUP') {
        await createOrder()
        return
      }

      const reference = `APH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
      openPaystack({
        email: user.email || `${user.phone}@adepaporkhub.shop`,
        amountKobo: total,
        reference,
        metadata: { customer_id: user.id },
        onSuccess: async (ref) => {
          // Charged. Try to create the order — auto-retry once after a beat
          // before surfacing the recovery panel.
          try {
            await createOrder(ref)
          } catch {
            try {
              await new Promise((res) => setTimeout(res, 1500))
              await createOrder(ref)
            } catch {
              setPaymentLimbo({ reference: ref, retrying: false })
            }
          }
        },
        onClose: () => { setLoading(false); toast.info('Payment cancelled.') },
      })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  async function retryRecovery() {
    if (!paymentLimbo) return
    setPaymentLimbo({ ...paymentLimbo, retrying: true })
    try {
      await createOrder(paymentLimbo.reference)
    } catch {
      setPaymentLimbo({ ...paymentLimbo, retrying: false })
      toast.error('Still could not save your order. Please contact us with your reference.')
    }
  }

  // ── Recovery panel — full takeover, money is at stake ──────────────────
  if (paymentLimbo) {
    const waMsg = encodeURIComponent(
      `Hi Adepa, my payment went through but my order didn't save. My reference is ${paymentLimbo.reference}.`,
    )
    return (
      <div className="container-tight grid min-h-[70vh] place-items-center py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-medium ring-1 ring-amber-200">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="display text-2xl font-bold">Your payment went through</h1>
          <p className="mt-2 text-night-700">
            We charged your card successfully, but something interrupted saving your order.
            <strong> Your money is safe.</strong> Tap below to finish, or send us your reference
            on WhatsApp and we'll sort it immediately.
          </p>

          <div className="mt-5 rounded-xl bg-cream px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-night-500">Payment reference</p>
            <p className="display mt-1 select-all font-mono text-lg font-bold text-flame">{paymentLimbo.reference}</p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={retryRecovery} loading={paymentLimbo.retrying} size="lg" className="flex-1">
              Finish my order
            </Button>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline flex-1"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-tight py-10">
      <h1 className="display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <p className="mt-1 text-night-600">A few details and your pork is on the way.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Delivery method */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-night-500">
              <Truck className="h-4 w-4 text-flame" /> Delivery method
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: 'HOME',   label: 'Home delivery', desc: 'Across Accra & Tema', price: 'GHS 15' },
                { value: 'PICKUP', label: 'Stand pickup',  desc: 'Collect at a stand',  price: 'Free' },
              ].map((m) => {
                const active = method === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value as Method)}
                    className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                      active
                        ? 'border-flame bg-flame-50 shadow-flame'
                        : 'border-night-200 hover:border-flame/40'
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-night-900">{m.label}</span>
                      <span className="block text-xs text-night-500">{m.desc}</span>
                    </span>
                    <span className={`text-sm font-bold ${active ? 'text-flame' : 'text-night-700'}`}>{m.price}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Address or pickup */}
          {method === 'HOME' && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-night-500">
                <MapPin className="h-4 w-4 text-flame" /> Delivery address
              </h2>
              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                        addressId === a.id ? 'border-flame bg-flame-50' : 'border-night-200 hover:border-flame/40'
                      }`}
                    >
                      <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-flame" />
                      <div>
                        <p className="text-sm font-semibold">{a.label} • {a.recipient}</p>
                        <p className="text-xs text-night-600">{a.area}, {a.district} • {a.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 rounded-2xl border-2 border-night-200 p-4 sm:grid-cols-2">
                  <Input label="Recipient name" value={newAddress.recipient} onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })} />
                  <Input label="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  <Input label="Area" value={newAddress.area} onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} />
                  <Input label="District" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} />
                  <Input label="Landmark (optional)" className="sm:col-span-2" value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                </div>
              )}
            </section>
          )}

          {method === 'PICKUP' && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-night-500">
                <MapPin className="h-4 w-4 text-flame" /> Pickup location
              </h2>
              {stands.length === 0 ? (
                <p className="rounded-2xl border-2 border-night-200 p-4 text-sm text-night-500">
                  No active stands this week. Choose home delivery instead.
                </p>
              ) : (
                <select className="input" value={pickupName} onChange={(e) => setPickupName(e.target.value)}>
                  {stands.map((s) => <option key={s.name} value={s.name}>{s.name} — {s.area}</option>)}
                </select>
              )}
            </section>
          )}

          {/* Promo code */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-night-500">
              <Tag className="h-4 w-4 text-flame" /> Promo code
            </h2>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
              <Button variant="outline" onClick={applyPromo}>Apply</Button>
            </div>
            {promo && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                <Check className="h-3.5 w-3.5" /> {promo.message}
              </p>
            )}
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-3xl bg-white p-6 shadow-medium ring-1 ring-night-100 lg:sticky lg:top-24">
          <h2 className="display text-lg font-bold">Your order</h2>

          <ul className="mt-4 space-y-3">
            {items.map((i) => {
              const mark =
                i.product.product_line === 'READY_TO_EAT' ? 'ready' :
                i.product.product_line === 'SPICED'       ? 'spiced' : 'raw'
              return (
                <li key={i.product.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-night-100">
                    {i.product.image_url
                      ? <img src={i.product.image_url} alt={i.product.name} className="h-full w-full object-cover" />
                      : <PorkMark variant={mark} />}
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-night-900 px-1 text-[10px] font-bold text-white">
                      {i.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-night-900">{i.product.name}</p>
                    <p className="text-xs text-night-500">{formatGhs(i.product.price_kobo)} each</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatGhs(i.product.price_kobo * i.quantity)}</span>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 space-y-2 border-t border-night-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-night-500">Subtotal</span><span className="tabular-nums">{formatGhs(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-night-500">Delivery</span><span className="tabular-nums">{deliveryFee === 0 ? 'Free' : formatGhs(deliveryFee)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span className="tabular-nums">− {formatGhs(discount)}</span></div>}
          </div>

          <div className="mt-4 flex items-end justify-between rounded-2xl bg-night-900 px-5 py-4 text-white">
            <span className="text-xs uppercase tracking-wider text-white/60">Total</span>
            <span className="display text-3xl font-bold text-gold tabular-nums">{formatGhs(total)}</span>
          </div>

          <Button onClick={placeOrder} loading={loading} className="mt-4 w-full" size="lg">
            <CreditCard className="h-5 w-5" /> {method === 'PICKUP' ? 'Place order' : `Pay ${formatGhs(total)}`}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-night-500">
            <Check className="h-3.5 w-3.5 text-green-600" /> Secure payment via Paystack
          </p>
        </aside>
      </div>
    </div>
  )
}
