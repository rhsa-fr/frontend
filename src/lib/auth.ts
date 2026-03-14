import { api } from './axios'
import { tokenStorage } from './token'
import { setAuthCookie, removeAuthCookie } from './cookies'
import { LoginRequest, LoginResponse, MeResponse, AuthUser } from '@/types/auth'

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * POST /api/v1/auth/login
   * Stores token in localStorage + cookie (for middleware).
   */
  login: async (credentials: LoginRequest): Promise<AuthUser> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials)

    // Persist in localStorage (for Axios interceptor)
    tokenStorage.setToken(response.access_token)
    tokenStorage.setUser(response.user)

    // Mirror to cookie so Next.js middleware can read it server-side
    setAuthCookie(response.access_token)

    return response.user
  },

  /**
   * POST /api/v1/auth/logout
   * Clears localStorage + cookie.
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Still clear local state even if server errors
    } finally {
      tokenStorage.clear()
      removeAuthCookie()
    }
  },

  /**
   * GET /api/v1/auth/me
   * Fetch current authenticated user from backend.
   */
  me: async (): Promise<MeResponse> => {
    return api.get<MeResponse>('/auth/me')
  },
}
