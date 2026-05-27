import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Megaphone, Calendar,
  Tag, Users, UserCircle, BarChart3, FileText, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/admin',                label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/orders',         label: 'Orders',        icon: ShoppingBag },
  { to: '/admin/products',       label: 'Products',      icon: Package },
  { to: '/admin/announcements',  label: 'Announcements', icon: Megaphone },
  { to: '/admin/events',         label: 'Events',        icon: Calendar },
  { to: '/admin/campaigns',      label: 'Campaigns',     icon: Tag },
  { to: '/admin/employees',      label: 'Employees',     icon: Users },
  { to: '/admin/customers',      label: 'Customers',     icon: UserCircle },
  { to: '/admin/analytics',      label: 'Analytics',     icon: BarChart3 },
  { to: '/admin/audit-logs',     label: 'Audit log',     icon: FileText },
  { to: '/admin/profile',        label: 'My account',    icon: UserCircle, divider: true },
]

export default function AdminLayout() {
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-night-100 bg-night-900 text-white">
        <div className="container-tight flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded-full p-2 hover:bg-white/10 lg:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame text-lg font-bold">A</span>
              <span className="display text-lg font-bold">Admin Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-white/70 hover:text-white">View site</Link>
            <Link
              to="/admin/profile"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
              title="My account"
            >
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-tight grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${open ? 'block' : 'hidden'} lg:block`}>
          <nav className="space-y-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-night-100">
            {NAV.map((n) => {
              const Icon = n.icon
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/admin'}
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
    </div>
  )
}
