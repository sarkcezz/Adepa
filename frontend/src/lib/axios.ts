import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message ?? error.message ?? 'Request failed'

    if (status === 401) {
      useAuthStore.getState().clear()
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/employee')) {
        window.location.href = '/login'
      }
    } else if (status === 422) {
      const errors = error.response?.data?.errors
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0]
        toast.error(Array.isArray(first) ? first[0] : String(first))
      } else {
        toast.error(message)
      }
    } else if (status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(error)
  },
)
