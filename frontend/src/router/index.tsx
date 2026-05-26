import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import EmployeeLayout from '@/components/layout/EmployeeLayout'

import Home from '@/pages/public/Home'
import Products from '@/pages/public/Products'
import ProductDetail from '@/pages/public/ProductDetail'
import Events from '@/pages/public/Events'
import Locations from '@/pages/public/Locations'
import Checkout from '@/pages/public/Checkout'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import EmployeeLogin from '@/pages/auth/EmployeeLogin'

import Dashboard from '@/pages/dashboard/Dashboard'
import Orders from '@/pages/dashboard/Orders'
import OrderDetail from '@/pages/dashboard/OrderDetail'
import OrderTracking from '@/pages/dashboard/OrderTracking'
import Profile from '@/pages/dashboard/Profile'
import MyEvents from '@/pages/dashboard/MyEvents'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements'
import AdminEvents from '@/pages/admin/AdminEvents'
import AdminCampaigns from '@/pages/admin/AdminCampaigns'
import AdminEmployees from '@/pages/admin/AdminEmployees'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'

import EmployeeDashboard from '@/pages/employee/EmployeeDashboard'
import RecordSale from '@/pages/employee/RecordSale'
import SalesHistory from '@/pages/employee/SalesHistory'
import SaleReceipt from '@/pages/employee/SaleReceipt'

function ProtectedRoute({ roles }: { roles: string[] }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
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
      { path: '/checkout',        element: <Checkout /> },
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
          { path: '/dashboard',                  element: <Dashboard /> },
          { path: '/dashboard/orders',           element: <Orders /> },
          { path: '/dashboard/orders/:id',       element: <OrderDetail /> },
          { path: '/dashboard/orders/:id/track', element: <OrderTracking /> },
          { path: '/dashboard/profile',          element: <Profile /> },
          { path: '/dashboard/events',           element: <MyEvents /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin',                element: <AdminDashboard /> },
          { path: '/admin/orders',         element: <AdminOrders /> },
          { path: '/admin/products',       element: <AdminProducts /> },
          { path: '/admin/announcements',  element: <AdminAnnouncements /> },
          { path: '/admin/events',         element: <AdminEvents /> },
          { path: '/admin/campaigns',      element: <AdminCampaigns /> },
          { path: '/admin/employees',      element: <AdminEmployees /> },
          { path: '/admin/customers',      element: <AdminCustomers /> },
          { path: '/admin/analytics',      element: <AdminAnalytics /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['employee', 'admin']} />,
    children: [
      {
        element: <EmployeeLayout />,
        children: [
          { path: '/employee',                  element: <EmployeeDashboard /> },
          { path: '/employee/sale',             element: <RecordSale /> },
          { path: '/employee/sale/:id/receipt', element: <SaleReceipt /> },
          { path: '/employee/history',          element: <SalesHistory /> },
        ],
      },
    ],
  },
])
