import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, History, LogOut, WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { useHeldCarts } from '@/hooks/useHeldCarts'
import { AdepaMark } from '@/components/common/PorkMark'

const NAV = [
  { to: '/employee',         label: 'Home',    icon: LayoutDashboard },
  { to: '/employee/sale',    label: 'Sell',    icon: ShoppingBag },
  { to: '/employee/history', label: 'History', icon: History },
]

export default function EmployeeLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const offline = useOfflineQueue()
  const holds   = useHeldCarts()

  // Full-bleed for the POS — denser layout, no side nav
  const isPOS = location.pathname.startsWith('/employee/sale') &&
                !location.pathname.includes('/receipt')

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-30 border-b border-night-100 bg-white/95 backdrop-blur">
        <div className={`flex h-16 items-center justify-between gap-3 px-4 sm:px-6 ${isPOS ? '' : 'container-tight'}`}>
          <Link to="/employee" className="flex items-center gap-2.5 group">
            <span className="h-9 w-9"><AdepaMark /></span>
            <span className="display hidden text-base font-bold leading-none text-night-900 sm:inline">
              Adepa
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-flame mt-0.5">POS</span>
            </span>
          </Link>

          {/* Center nav — pill style */}
          <nav className="hidden items-center gap-1 rounded-full bg-night-100 p-1 md:flex">
            {NAV.map((n) => {
              const Icon = n.icon
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/employee'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors
                      ${isActive ? 'bg-white text-flame shadow-soft' : 'text-night-600 hover:text-night-900'}`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {n.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Right-side: status + logout */}
          <div className="flex items-center gap-2">
            {!offline.online && (
              <span
                title="Offline — sales queue locally"
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200"
              >
                <WifiOff className="h-3 w-3" />
                Offline
              </span>
            )}
            {offline.pending.length > 0 && offline.online && (
              <span className="inline-flex items-center gap-1 rounded-full bg-flame/10 px-2.5 py-1 text-[11px] font-semibold text-flame ring-1 ring-flame/20">
                {offline.pending.length} queued
              </span>
            )}
            {holds.count > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold-700 ring-1 ring-gold/30">
                {holds.count} held
              </span>
            )}
            <div className="hidden text-right text-[11px] leading-tight md:block">
              <p className="font-mono text-night-900">{user?.employee_id}</p>
              <p className="text-night-500">{user?.name?.split(' ')[0]}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full bg-night-100 p-2 text-night-700 cursor-pointer transition-colors hover:bg-flame hover:text-white"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile bottom-nav alternative — pill links visible always on small screens */}
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 no-scrollbar md:hidden">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/employee'}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors
                    ${isActive ? 'bg-flame text-white shadow-flame' : 'bg-night-100 text-night-700'}`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className={`flex-1 ${isPOS ? 'p-3 sm:p-4' : 'container-tight py-8'}`}>
        <Outlet />
      </main>
    </div>
  )
}
