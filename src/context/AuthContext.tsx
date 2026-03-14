'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { AuthUser, AuthState, LoginRequest, UserRole } from '@/types/auth'
import { authService } from '@/lib/auth'
import { tokenStorage, isTokenValid } from '@/lib/token'

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = tokenStorage.getToken()
    const user = tokenStorage.getUser()

    if (isTokenValid(token) && user) {
      setState({ user, token, isAuthenticated: true, isLoading: false })
    } else {
      tokenStorage.clear()
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginRequest) => {
    const user = await authService.login(credentials)
    const token = tokenStorage.getToken()!

    setState({ user, token, isAuthenticated: true, isLoading: false })
    router.push('/dashboard')
  }, [router])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    await authService.logout()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
    router.push('/login')
  }, [router])

  // ── role check ────────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!state.user) return false
      return roles.includes(state.user.role)
    },
    [state.user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, hasRole }),
    [state, login, logout, hasRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hooks
// ============================================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function useUser(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('No authenticated user')
  return user
}
