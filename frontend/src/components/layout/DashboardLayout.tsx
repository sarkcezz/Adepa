import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, User, Calendar, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { WhatsAppFAB } from '@/components/common/WhatsAppFAB'

const NAV = [
  { to: '/dashboard',         label: 'Overview',  icon: LayoutDashboard },
  { to: '/dashboard/orders',  label: 'My Orders', icon: ShoppingBag },
  { to: '/dashboard/events',  label: 'Events',    icon: Calendar },
  { to: '/dashboard/profile', label: 'Profile',   icon: User },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-night-100 bg-white">
        <div className="container-tight flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame text-lg font-bold text-white">A</span>
            <span className="display text-lg font-bold">Adepa Pork Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-night-600 sm:inline">Hi, {user?.name?.split(' ')[0]}</span>
            <button onClick={() => setOpen(!open)} className="rounded-full p-2 md:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container-tight grid gap-6 py-8 md:grid-cols-[240px_1fr]">
        <aside className={`${open ? 'block' : 'hidden'} md:block`}>
          <nav className="space-y-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-night-100">
            {NAV.map((n) => {
              const Icon = n.icon
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/dashboard'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-flame text-white' : 'text-night-700 hover:bg-cream'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </NavLink>
              )
            })}
            <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-night-600 hover:bg-red-50 hover:text-red-700">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      <WhatsAppFAB />
    </div>
  )
}
