import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap { success, data } envelope
api.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success !== undefined && res.data.data !== undefined) {
      res.data = res.data.data
    }
    return res
  },
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

// ─── AUTH ───────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; mobile: string; password: string }) =>
    api.post('/auth/register', data),
}

// ─── PRODUCTS ───────────────────────────────────────
export const productsApi = {
  list:   () => api.get('/products'),
  get:    (id: number) => api.get(`/products/${id}`),
  create: (data: FormData | object) => api.post('/products', data),
  update: (id: number, data: object) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

// ─── ORDERS ─────────────────────────────────────────
export const ordersApi = {
  create:      (data: object) => api.post('/orders', data),
  mine:        () => api.get('/orders'),
  all:         (status?: string) => api.get('/orders/all', { params: status ? { status } : {} }),
  track:       (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  updateStatus:(id: number, status: string) => api.patch(`/orders/${id}/status`, { status }),
  cancel:      (id: number) => api.post(`/orders/${id}/cancel`),
}

// ─── COUPONS ────────────────────────────────────────
export const couponsApi = {
  list:     () => api.get('/coupons'),
  validate: (code: string, amount: number) =>
    api.post('/coupons/validate', { code, orderAmount: amount }),
  create:   (data: object) => api.post('/coupons', data),
  update:   (id: number, data: object) => api.put(`/coupons/${id}`, data),
}

// ─── USERS ──────────────────────────────────────────
export const usersApi = {
  list:           () => api.get('/users'),
  get:            (id: number) => api.get(`/users/${id}`),
  update:         (id: number, data: object) => api.patch(`/users/${id}`, data),
  setRole:        (id: number, role: string) => api.patch(`/users/${id}/role`, { role }),
  toggleActive:   (id: number, isActive: boolean) => api.patch(`/users/${id}/toggle-active`, { isActive }),
  delete:         (id: number) => api.delete(`/users/${id}`),
  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    api.patch(`/users/${id}/change-password`, { currentPassword, newPassword }),
}

// ─── DELIVERY ───────────────────────────────────────
export const deliveryApi = {
  slots:      () => api.get('/delivery/slots'),
  agents:     () => api.get('/delivery/agents'),
  addAgent:   (data: object) => api.post('/delivery/agents', data),
}
