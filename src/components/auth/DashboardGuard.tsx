'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface DashboardGuardProps {
  children: React.ReactNode
}

/**
 * Client-side guard for dashboard pages.
 * Works in tandem with middleware.ts (server-side).
 * Handles cases where middleware cookie check misses (e.g. token just expired).
 */
export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-ink-400 animate-spin" />
          <p className="text-xs text-ink-300">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
