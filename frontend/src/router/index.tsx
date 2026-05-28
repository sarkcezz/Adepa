import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

// ── Public — eager-loaded (first-paint matters) ─────────────────────────
import Home from '@/pages/public/Home'
import Products from '@/pages/public/Products'
import ProductDetail from '@/pages/public/ProductDetail'
import Events from '@/pages/public/Events'
import Locations from '@/pages/public/Locations'

// ── Customer-only auth pages — small, eager ────────────────────────────
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import EmployeeLogin from '@/pages/auth/EmployeeLogin'

// ── Lazy chunks ────────────────────────────────────────────────────────
//
// Anything under /checkout, /dashboard, /admin, /employee is split into
// its own chunk. The public visitor downloads ~300KB instead of ~950KB;
// admin/employee chunks load on demand.

const Checkout = lazy(() => import('@/pages/public/Checkout'))

const ForcePasswordChange = lazy(() => import('@/pages/auth/ForcePasswordChange'))

const Dashboard       = lazy(() => import('@/pages/dashboard/Dashboard'))
const Orders          = lazy(() => import('@/pages/dashboard/Orders'))
const OrderDetail     = lazy(() => import('@/pages/dashboard/OrderDetail'))
const OrderTracking   = lazy(() => import('@/pages/dashboard/OrderTracking'))
const Profile         = lazy(() => import('@/pages/dashboard/Profile'))
const MyEvents        = lazy(() => import('@/pages/dashboard/MyEvents'))

const AdminLayout         = lazy(() => import('@/components/layout/AdminLayout'))
const AdminDashboard      = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminOrders         = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminProducts       = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminAnnouncements  = lazy(() => import('@/pages/admin/AdminAnnouncements'))
const AdminEvents         = lazy(() => import('@/pages/admin/AdminEvents'))
const AdminCampaigns      = lazy(() => import('@/pages/admin/AdminCampaigns'))
const AdminEmployees      = lazy(() => import('@/pages/admin/AdminEmployees'))
const AdminCustomers      = lazy(() => import('@/pages/admin/AdminCustomers'))
const AdminAnalytics      = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminAuditLogs      = lazy(() => import('@/pages/admin/AdminAuditLogs'))
const AdminProfile        = lazy(() => import('@/pages/admin/AdminProfile'))

const EmployeeLayout    = lazy(() => import('@/components/layout/EmployeeLayout'))
const EmployeeDashboard = lazy(() => import('@/pages/employee/EmployeeDashboard'))
const RecordSale        = lazy(() => import('@/pages/employee/RecordSale'))
const SalesHistory      = lazy(() => import('@/pages/employee/SalesHistory'))
const SaleReceipt       = lazy(() => import('@/pages/employee/SaleReceipt'))

// Wraps a lazy element so React Router shows a friendly spinner while
// the chunk downloads (rather than an empty page).
const Lazy = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><LoadingSpinner /></div>}>
    <Component />
  </Suspense>
)

function ProtectedRoute({ roles }: { roles: string[] }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  // Forced password change — until the flag is cleared, every nested
  // route renders the change-password interstitial instead of its
  // intended page. The Profile page lives outside this gate so the
  // change form itself remains reachable.
  if (user.force_password_change) return <Navigate to="/change-password" replace />
  return <Outlet />
}

/** Bare guard for the /change-password route — needs auth but not role check. */
function AuthOnly() {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/',                element: <Home /> },
      { path: '/products',        element: <Products /> },
      { path: '/products/:id',    element: <ProductDetail /> },
      { path: '/events',          element: <Events /> },
      { path: '/locations',       element: <Locations /> },
      { path: '/checkout',        element: Lazy(Checkout) },
      { path: '/login',           element: <Login /> },
      { path: '/register',        element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password',  element: <ResetPassword /> },
      { path: '/employee/login',  element: <EmployeeLogin /> },
    ],
  },
  {
    element: <ProtectedRoute roles={['customer', 'admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard',                  element: Lazy(Dashboard) },
          { path: '/dashboard/orders',           element: Lazy(Orders) },
          { path: '/dashboard/orders/:id',       element: Lazy(OrderDetail) },
          { path: '/dashboard/orders/:id/track', element: Lazy(OrderTracking) },
          { path: '/dashboard/profile',          element: Lazy(Profile) },
          { path: '/dashboard/events',           element: Lazy(MyEvents) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      {
        element: Lazy(AdminLayout),
        children: [
          { path: '/admin',                element: Lazy(AdminDashboard) },
          { path: '/admin/orders',         element: Lazy(AdminOrders) },
          { path: '/admin/products',       element: Lazy(AdminProducts) },
          { path: '/admin/announcements',  element: Lazy(AdminAnnouncements) },
          { path: '/admin/events',         element: Lazy(AdminEvents) },
          { path: '/admin/campaigns',      element: Lazy(AdminCampaigns) },
          { path: '/admin/employees',      element: Lazy(AdminEmployees) },
          { path: '/admin/customers',      element: Lazy(AdminCustomers) },
          { path: '/admin/analytics',      element: Lazy(AdminAnalytics) },
          { path: '/admin/audit-logs',     element: Lazy(AdminAuditLogs) },
          { path: '/admin/profile',        element: Lazy(AdminProfile) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['employee', 'admin']} />,
    children: [
      {
        element: Lazy(EmployeeLayout),
        children: [
          { path: '/employee',                  element: Lazy(EmployeeDashboard) },
          { path: '/employee/sale',             element: Lazy(RecordSale) },
          { path: '/employee/sale/:id/receipt', element: Lazy(SaleReceipt) },
          { path: '/employee/history',          element: Lazy(SalesHistory) },
        ],
      },
    ],
  },
  {
    // Bare auth route — sits OUTSIDE ProtectedRoute so it can render
    // even while force_password_change=true (otherwise we'd infinite-loop).
    element: <AuthOnly />,
    children: [
      { path: '/change-password', element: Lazy(ForcePasswordChange) },
    ],
  },
])
