import { AuthUser, UserRole } from '@/types/auth'

const TOKEN_KEY = 'koperasi_token'
const USER_KEY  = 'koperasi_user'

// ============================================================================
// Token Storage — pakai sessionStorage agar otomatis bersih saat browser tutup
// ============================================================================

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(TOKEN_KEY)
  },

  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  },

  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  },

  setUser: (user: AuthUser): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  },

  clear: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
    }
  },
}

// ============================================================================
// JWT Helpers
// ============================================================================

interface JwtPayload {
  sub: string
  username: string
  role: UserRole
  exp: number
  iat: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload) return true
  return payload.exp * 1000 < Date.now()
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  return !isTokenExpired(token)
}