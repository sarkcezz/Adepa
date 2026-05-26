import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, ShoppingBag, User, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { WhatsAppFAB } from '@/components/common/WhatsAppFAB'

const NAV = [
  { to: '/',         label: 'Home' },
  { to: '/products', label: 'Menu' },
  { to: '/locations', label: 'Stand Locations' },
  { to: '/events',   label: 'Events' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = useCartStore((s) => s.count())
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const accountHref = user
    ? user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/employee' : '/dashboard'
    : '/login'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-night-100 bg-cream/95 backdrop-blur">
        <div className="container-tight flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame text-lg font-bold text-white">A</span>
            <span className="display text-lg font-bold text-night-900">Adepa Pork Hub</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-flame ${isActive ? 'text-flame' : 'text-night-700'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2.5 hover:bg-night-100" aria-label="Open cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-flame text-[10px] font-bold text-white">{cartCount}</span>
              )}
            </button>
            <button onClick={() => navigate(accountHref)} className="rounded-full p-2.5 hover:bg-night-100" aria-label="Account">
              <User className="h-5 w-5" />
            </button>
            <button onClick={() => setMenuOpen(true)} className="rounded-full p-2.5 hover:bg-night-100 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-night-900/60 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <span className="display text-lg font-bold">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="rounded-full p-1 hover:bg-night-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 font-medium transition-colors ${isActive ? 'bg-flame text-white' : 'text-night-800 hover:bg-night-100'}`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <div className="my-3 border-t border-night-100" />
              <NavLink to={accountHref} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-night-800 hover:bg-night-100">
                {user ? 'My Account' : 'Sign in'}
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-night-100 bg-night-900 text-night-100">
        <div className="container-tight grid gap-8 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame font-bold">A</span>
              <span className="display text-lg font-bold">Adepa Pork Hub</span>
            </div>
            <p className="text-sm text-night-100/70">Fresh. Spiced. Ready for Every Meal.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gold">Shop</h4>
            <ul className="space-y-2 text-sm text-night-100/70">
              <li><Link to="/products" className="hover:text-white">Raw cuts</Link></li>
              <li><Link to="/products" className="hover:text-white">Spiced</Link></li>
              <li><Link to="/products" className="hover:text-white">Ready-to-Eat</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gold">Company</h4>
            <ul className="space-y-2 text-sm text-night-100/70">
              <li><Link to="/locations" className="hover:text-white">Stand locations</Link></li>
              <li><Link to="/events" className="hover:text-white">Pork events</Link></li>
              <li><Link to="/employee/login" className="hover:text-white">Employee login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gold">Contact</h4>
            <ul className="space-y-2 text-sm text-night-100/70">
              <li>orders@adepaporkhub.shop</li>
              <li>Accra, Ghana</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-night-100/50">
          © {new Date().getFullYear()} Adepa Pork Hub. All rights reserved.
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppFAB />
    </div>
  )
}
