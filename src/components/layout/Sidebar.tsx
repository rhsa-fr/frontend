'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Wallet,
  PiggyBank,
  CreditCard,
  Receipt,
  FileBarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ============================================================================
// Navigation definition
// ============================================================================

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  section: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { label: 'Anggota', href: '/dashboard/anggota', icon: Users, section: 'data' },
  { label: 'Profil Anggota', href: '/dashboard/profil-anggota', icon: UserCircle, section: 'data' },
  { label: 'Jenis Simpanan', href: '/dashboard/jenis-simpanan', icon: Wallet, section: 'keuangan' },
  { label: 'Simpanan', href: '/dashboard/simpanan', icon: PiggyBank, section: 'keuangan' },
  { label: 'Pinjaman', href: '/dashboard/pinjaman', icon: CreditCard, section: 'keuangan' },
  { label: 'Angsuran', href: '/dashboard/angsuran', icon: Receipt, section: 'keuangan' },
  { label: 'Laporan', href: '/dashboard/laporan', icon: FileBarChart2, section: 'report' },
]

const SECTION_LABELS: Record<string, string> = {
  main: '',
  data: 'Data Master',
  keuangan: 'Keuangan',
  report: 'Laporan',
}

const SECTIONS = ['main', 'data', 'keuangan', 'report']

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  ketua: 'Ketua',
  bendahara: 'Bendahara',
}

// ============================================================================
// Sidebar
// ============================================================================

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const grouped = SECTIONS.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: NAV_ITEMS.filter((item) => item.section === section),
  }))

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-white border-r border-surface-300',
        'transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex items-center gap-2.5 h-14 px-4 border-b border-surface-200 shrink-0',
          collapsed && 'justify-center px-0'
        )}
      >
        {/* Logo icon — always visible */}
        <Image
          src="/logo.svg"
          alt="KOPDAR"
          width={32}
          height={32}
          className="shrink-0 object-contain"
          priority
        />

        {/* Text — hidden when collapsed */}
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-sm font-bold text-ink-800 leading-none tracking-widest">KOPDAR</p>
            <p className="text-[9px] text-ink-300 mt-0.5 tracking-wider uppercase">Simpan Pinjam</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {grouped.map(({ section, label, items }) => (
          <div key={section} className="mb-1">
            {label && !collapsed && (
              <p className="text-[10px] font-semibold tracking-widest uppercase text-ink-300 px-3 pt-3 pb-1.5">
                {label}
              </p>
            )}
            {label && collapsed && <div className="my-2 mx-3 h-px bg-surface-200" />}

            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'sidebar-link',
                  isActive(item.href) && 'active',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn('icon shrink-0', isActive(item.href) ? 'text-white' : 'text-ink-400')}
                />
                {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Info + Logout ── */}
      <div className="shrink-0 border-t border-surface-200">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-4 py-3 animate-fade-in">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-800 truncate">{user.username}</p>
              <p className="text-[10px] text-ink-300 capitalize">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </div>
        )}

        <div className="px-2 pb-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600',
              collapsed && 'justify-center px-0',
              loggingOut && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loggingOut ? (
              <Loader2 className="icon shrink-0 text-red-400 animate-spin" />
            ) : (
              <LogOut className="icon shrink-0 text-red-400" />
            )}
            {!collapsed && (
              <span className="animate-fade-in">{loggingOut ? 'Keluar...' : 'Logout'}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[68px] w-6 h-6 bg-white border border-surface-300 rounded-full
                   flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10
                   text-ink-400 hover:text-ink-800"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}