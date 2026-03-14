import { NextRequest, NextResponse } from 'next/server'

const TOKEN_KEY = 'koperasi_token'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login']

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard']

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from cookies (set by login page after auth)
  const token = request.cookies.get(TOKEN_KEY)?.value

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // ── Redirect authenticated users away from /login ────────────────────────
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Redirect unauthenticated users to /login ─────────────────────────────
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
}
