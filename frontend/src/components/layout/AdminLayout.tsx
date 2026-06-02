import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Package, Megaphone, Calendar,
  Tag, Users, UserCircle, BarChart3, FileText, LogOut, Menu, X, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AdepaMark } from '@/components/common/PorkMark'

// Grouped so the sidebar reads as sections rather than one long flat list.
const NAV_GROUPS: { heading: string; items: { to: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    heading: 'Operate',
    items: [
      { to: '/admin',           label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/orders',    label: 'Orders',    icon: ShoppingBag },
      { to: '/admin/products',  label: 'Products',  icon: Package },
    ],
  },
  {
    heading: 'Engage',
    items: [
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/events',        label: 'Events',        icon: Calendar },
      { to: '/admin/campaigns',     label: 'Campaigns',     icon: Tag },
    ],
  },
  {
    heading: 'People',
    items: [
      { to: '/admin/employees', label: 'Employees', icon: Users },
      { to: '/admin/customers', label: 'Customers', icon: UserCircle },
    ],
  },
  {
    heading: 'Insight',
    items: [
      { to: '/admin/analytics',  label: 'Analytics', icon: BarChart3 },
      { to: '/admin/audit-logs', label: 'Audit log', icon: FileText },
    ],
  },
]

export default function AdminLayout() {
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-flame text-white shadow-flame' : 'text-night-700 hover:bg-cream hover:text-flame'
    }`

  return (
    <div className="min-h-screen bg-cream">
      {/* Header — warm charcoal with the real brand mark */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-gradient-night text-white">
        <div className="container-tight flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded-full p-2 cursor-pointer hover:bg-white/10 lg:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2.5">
              <span className="h-9 w-9"><AdepaMark /></span>
              <span className="display text-base font-bold leading-none">
                Adepa
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-gold">Admin</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              View site <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/admin/profile"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
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
          <nav className="space-y-5 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-night-100 lg:sticky lg:top-24">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-night-400">
                  {group.heading}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((n) => {
                    const Icon = n.icon
                    return (
                      <NavLink key={n.to} to={n.to} end={n.to === '/admin'} onClick={() => setOpen(false)} className={linkClass}>
                        <Icon className="h-4 w-4" />
                        {n.label}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="border-t border-night-100 pt-3">
              <NavLink to="/admin/profile" onClick={() => setOpen(false)} className={linkClass}>
                <UserCircle className="h-4 w-4" />
                My account
              </NavLink>
              <button
                onClick={logout}
                className="mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-night-600 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
