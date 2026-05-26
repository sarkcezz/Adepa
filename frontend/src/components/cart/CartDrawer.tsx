import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatGhs } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, setQty, remove, subtotalKobo } = useCartStore()

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-night-900/60 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-night-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-flame" /> Your Cart
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-night-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-3 h-12 w-12 text-night-300" />
              <p className="text-night-500">Your cart is empty.</p>
              <Link to="/products" onClick={onClose} className="mt-4 text-flame hover:underline">
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white text-2xl">
                    {item.product.product_line === 'READY_TO_EAT' ? '🍖' : item.product.product_line === 'SPICED' ? '🌶️' : '🥩'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.product.name}</p>
                    <p className="text-xs text-night-500">{formatGhs(item.product.price_kobo)}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button onClick={() => setQty(item.product.id, item.quantity - 1)} className="rounded-md bg-white p-1 ring-1 ring-night-200">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => setQty(item.product.id, item.quantity + 1)} className="rounded-md bg-white p-1 ring-1 ring-night-200">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => remove(item.product.id)} className="rounded-md p-2 text-night-400 hover:bg-white hover:text-flame">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-night-100 px-5 py-4">
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-night-500">Subtotal</span>
              <span className="font-semibold">{formatGhs(subtotalKobo())}</span>
            </div>
            <Link to="/checkout" onClick={onClose}>
              <Button className="w-full">Checkout</Button>
            </Link>
          </footer>
        )}
      </aside>
    </>
  )
}
