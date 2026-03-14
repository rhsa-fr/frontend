// ============================================================================
// Auth Types — matches backend FastAPI schema
// ============================================================================

export type UserRole = 'admin' | 'ketua' | 'bendahara'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
}

// POST /api/v1/auth/login — request body
export interface LoginRequest {
  username: string
  password: string
}

// POST /api/v1/auth/login — response body
export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthUser
}

// GET /api/v1/auth/me — response body
export interface MeResponse {
  id_user: number
  username: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
