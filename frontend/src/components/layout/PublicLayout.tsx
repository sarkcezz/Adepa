import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, ShoppingBag, User, X, Instagram, Facebook } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { WhatsAppFAB } from '@/components/common/WhatsAppFAB'
import { AdepaMark } from '@/components/common/PorkMark'

const NAV = [
  { to: '/',          label: 'Home' },
  { to: '/products',  label: 'Menu' },
  { to: '/locations', label: 'Stands' },
  { to: '/events',    label: 'Events' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const cartCount = useCartStore((s) => s.count())
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Add subtle elevation when the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const accountHref = user
    ? user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/employee' : '/dashboard'
    : '/login'

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'border-b border-night-100 bg-cream/95 shadow-soft backdrop-blur-xl'
            : 'bg-cream/80 backdrop-blur-md'
        }`}
      >
        <div className="container-tight flex h-16 items-center justify-between md:h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="h-10 w-10 transition-transform group-hover:rotate-3">
              <AdepaMark />
            </span>
            <span className="display text-lg font-bold leading-none text-night-900 sm:text-xl">
              Adepa
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-flame mt-0.5">
                Pork Hub
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `relative text-sm font-medium tracking-tight transition-colors hover:text-flame ${
                    isActive ? 'text-flame' : 'text-night-700'
                  } after:absolute after:-bottom-1.5 after:left-1/2 after:h-0.5 after:rounded-full after:bg-flame after:transition-all after:duration-300 ${
                    isActive ? 'after:left-0 after:w-full' : 'after:w-0 hover:after:left-0 hover:after:w-full'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 text-night-700 cursor-pointer transition-colors hover:bg-night-100 hover:text-flame"
              aria-label={`Open cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-flame text-[10px] font-bold text-white ring-2 ring-cream animate-slide-down"
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate(accountHref)}
              className="rounded-full p-2.5 text-night-700 cursor-pointer transition-colors hover:bg-night-100 hover:text-flame"
              aria-label={user ? 'My account' : 'Sign in'}
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2.5 text-night-700 cursor-pointer transition-colors hover:bg-night-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-night-900/60 backdrop-blur-sm animate-fade-in md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[88vw] bg-cream p-6 shadow-2xl animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                <span className="h-9 w-9"><AdepaMark /></span>
                <span className="display text-base font-bold">Adepa</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-1.5 cursor-pointer hover:bg-night-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1" aria-label="Mobile">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 font-medium transition-all ${
                      isActive
                        ? 'bg-flame text-white shadow-flame'
                        : 'text-night-800 hover:bg-night-100'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <div className="my-4 border-t border-night-100" />
              <NavLink
                to={accountHref}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 font-medium text-night-800 transition-colors hover:bg-night-100"
              >
                {user ? 'My Account' : 'Sign in'}
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="relative overflow-hidden bg-night-900 text-night-100 noise">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2">
          <div className="h-64 w-[800px] rounded-full bg-flame/20 blur-3xl" />
        </div>

        <div className="container-tight relative">
          {/* Top — newsletter strip */}
          <div className="grid gap-6 border-b border-white/10 py-12 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <p className="eyebrow text-gold">Stay in the loop</p>
              <h3 className="display-2 mt-2 text-white">
                New cuts, events,<br />and stand drops.
              </h3>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex max-w-md flex-col gap-3 sm:flex-row md:ml-auto"
              aria-label="Subscribe to newsletter"
            >
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="you@example.com"
                className="flex-1 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <button
                type="submit"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night-900 cursor-pointer transition-all hover:bg-gold-400 hover:-translate-y-0.5"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Middle — links + brand */}
          <div className="grid gap-10 py-12 md:grid-cols-4 md:gap-8">
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="h-10 w-10"><AdepaMark /></span>
                <span className="display text-lg font-bold text-white">Adepa Pork Hub</span>
              </div>
              <p className="text-sm leading-relaxed text-night-100/70">
                Fresh. Spiced. Ready for every meal — premium Ghanaian pork from butcher-clean cuts to fire-grilled platters.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a href="#" aria-label="Instagram" className="rounded-full bg-white/5 p-2.5 text-night-100/70 transition-colors hover:bg-flame hover:text-white">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Facebook" className="rounded-full bg-white/5 p-2.5 text-night-100/70 transition-colors hover:bg-flame hover:text-white">
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Shop</h4>
              <ul className="space-y-2.5 text-sm text-night-100/70">
                <li><Link to="/products" className="transition-colors hover:text-white">All products</Link></li>
                <li><Link to="/products?line=RAW" className="transition-colors hover:text-white">Raw cuts</Link></li>
                <li><Link to="/products?line=SPICED" className="transition-colors hover:text-white">Spiced</Link></li>
                <li><Link to="/products?line=READY_TO_EAT" className="transition-colors hover:text-white">Ready-to-eat</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Company</h4>
              <ul className="space-y-2.5 text-sm text-night-100/70">
                <li><Link to="/locations" className="transition-colors hover:text-white">Stand locations</Link></li>
                <li><Link to="/events" className="transition-colors hover:text-white">Pork events</Link></li>
                <li><Link to="/employee/login" className="transition-colors hover:text-white">Employee login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Contact</h4>
              <ul className="space-y-2.5 text-sm text-night-100/70">
                <li><a href="mailto:orders@adepaporkhub.shop" className="transition-colors hover:text-white">orders@adepaporkhub.shop</a></li>
                <li>Accra, Ghana</li>
                <li className="pt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-night-100/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                    Open today · 8am–8pm
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-night-100/50 sm:flex-row">
            <p>© {new Date().getFullYear()} Adepa Pork Hub. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with care in <span className="font-semibold text-gold">Ghana</span>
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppFAB />
    </div>
  )
}
