import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, History, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/employee',         label: 'Overview',    icon: LayoutDashboard },
  { to: '/employee/sale',    label: 'Record Sale', icon: PlusCircle },
  { to: '/employee/history', label: 'My Sales',    icon: History },
]

export default function EmployeeLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-night-100 bg-white">
        <div className="container-tight flex h-16 items-center justify-between">
          <Link to="/employee" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-lg font-bold text-night-900">E</span>
            <span className="display text-lg font-bold">Employee Portal</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-night-600 sm:inline">{user?.employee_id} • {user?.name}</span>
            <button onClick={logout} className="rounded-lg bg-night-100 px-3 py-1.5 text-night-700 hover:bg-night-200">
              <LogOut className="inline h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container-tight grid gap-6 py-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-night-100">
            {NAV.map((n) => {
              const Icon = n.icon
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/employee'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-gold text-night-900' : 'text-night-700 hover:bg-cream'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
