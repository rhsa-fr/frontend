import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'
import { tokenStorage } from './token'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// Axios Instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle global errors ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg: string }[]; message?: string }>) => {
    const status = error.response?.status

    if (status === 401) {
      tokenStorage.clear()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
      return Promise.reject(new Error('Sesi berakhir. Silakan login kembali.'))
    }

    if (status === 403) {
      return Promise.reject(new Error('Anda tidak memiliki akses.'))
    }

    // FastAPI validation errors (422)
    if (status === 422) {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail)) {
        const msg = detail.map((d) => d.msg).join(', ')
        return Promise.reject(new Error(`Validasi gagal: ${msg}`))
      }
    }

    const message =
      (typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.response?.data?.message) ||
      error.message ||
      'Terjadi kesalahan.'

    return Promise.reject(new Error(message))
  }
)

// ============================================================================
// Typed API helpers
// ============================================================================

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
}

export default apiClient
