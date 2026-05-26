import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function useAuth() {
  const auth = useAuthStore()
  const navigate = useNavigate()

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    auth.setAuth(res.data.user, res.data.token)
    toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`)
    if (res.data.user.role === 'admin') navigate('/admin')
    else navigate('/dashboard')
  }

  async function employeeLogin(employee_id: string, password: string) {
    const res = await api.post('/auth/employee/login', { employee_id, password })
    auth.setAuth(res.data.user, res.data.token, res.data.force_password_change)
    toast.success(`Welcome, ${res.data.user.name.split(' ')[0]}!`)
    navigate('/employee')
  }

  async function register(payload: { name: string; email: string; phone: string; password: string }) {
    const res = await api.post('/auth/register', payload)
    auth.setAuth(res.data.user, res.data.token)
    toast.success('Account created!')
    navigate('/dashboard')
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    auth.clear()
    navigate('/')
  }

  return { ...auth, login, employeeLogin, register, logout }
}
