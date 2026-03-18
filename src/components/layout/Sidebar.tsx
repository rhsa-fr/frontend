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
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'

interface Setting {
  id_setting: number
  nama_koperasi: string
  deskripsi?: string
  alamat?: string
  no_telepon?: string
  email?: string
  bunga_default: number
  denda_keterlambatan: number
  min_nominal_pinjaman: number
  max_nominal_pinjaman?: number
  max_lama_angsuran: number
  saldo_minimal_simpanan: number
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  section: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',                icon: LayoutDashboard, section: 'main'     },
  { label: 'Anggota',        href: '/dashboard/anggota',        icon: Users,           section: 'data'     },
  { label: 'Profil Anggota', href: '/dashboard/profil-anggota', icon: UserCircle,      section: 'data'     },
  { label: 'Jenis Simpanan', href: '/dashboard/jenis-simpanan', icon: Wallet,          section: 'keuangan' },
  { label: 'Simpanan',       href: '/dashboard/simpanan',       icon: PiggyBank,       section: 'keuangan' },
  { label: 'Pinjaman',       href: '/dashboard/pinjaman',       icon: CreditCard,      section: 'keuangan' },
  { label: 'Angsuran',       href: '/dashboard/angsuran',       icon: Receipt,         section: 'keuangan' },
  { label: 'Laporan',        href: '/dashboard/laporan',        icon: FileBarChart2,   section: 'report'   },
  { label: 'Pengaturan',     href: '/dashboard/settings',       icon: Settings,        section: 'report'   },
]

const SECTION_LABELS: Record<string, string> = {
  main: '', data: 'Data Master', keuangan: 'Keuangan', report: 'Laporan',
}

const SECTIONS = ['main', 'data', 'keuangan', 'report']

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator', ketua: 'Ketua', bendahara: 'Bendahara',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed]       = useState(false)
  const [loggingOut, setLoggingOut]     = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [setting, setSetting] = useState<Setting | null>(null)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  // Fetch setting dari API
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const data = await api.get<Setting>('/setting')
        setSetting(data)
      } catch (error) {
        console.error('Gagal memuat setting:', error)
      }
    }
    fetchSetting()
  }, [])

  const handleLogout = async () => {
    setConfirmLogout(false)
    setLoggingOut(true)
    await logout()
  }

  const grouped = SECTIONS.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: NAV_ITEMS.filter((item) => {
      // Hide settings for non-admin users
      if (item.label === 'Pengaturan' && user?.role !== 'admin') {
        return false
      }
      return item.section === section
    }),
  }))

  return (
    <>
      <aside
        className={cn(
          'relative flex flex-col h-screen bg-white/95 backdrop-blur-md border-r border-slate-200/60',
          'transition-all duration-300 ease-in-out shrink-0 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* ── Logo ── */}
        <div
          className={cn(
            'flex items-center gap-3 h-20 px-6 shrink-0',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
             <Image src="/logo.svg" alt={setting?.nama_koperasi || 'Logo'} width={32} height={32} className="object-contain" priority />
          </div>
          {!collapsed && (
            <div className="animate-slide-in overflow-hidden">
              <p className="text-xs font-semibold text-ink-800 leading-none">
                {setting?.nama_koperasi || 'Kopdar'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">Simpan Pinjam</p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          {grouped.map(({ section, label, items }) => (
            <div key={section} className="mb-6">
              {label && !collapsed && (
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 px-4 mb-3">
                  {label}
                </p>
              )}
              {label && collapsed && <div className="my-4 mx-4 h-px bg-slate-100" />}
              <div className="space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'sidebar-link group', 
                      isActive(item.href) && 'active', 
                      collapsed && 'justify-center px-0 h-12 w-12 mx-auto'
                    )}
                  >
                    <item.icon className={cn(
                      'icon transition-transform duration-200 group-hover:scale-110', 
                      isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-[#2A7FC5]'
                    )} />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                    {isActive(item.href) && !collapsed && (
                      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full my-auto" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="px-4 py-6 border-t border-slate-100">
          <button
            onClick={() => setConfirmLogout(true)}
            disabled={loggingOut}
            className={cn(
              'sidebar-link w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100',
              collapsed && 'justify-center px-0 h-12 w-12 mx-auto',
              loggingOut && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loggingOut
              ? <Loader2 className="icon animate-spin" />
              : <LogOut className="icon" />
            }
            {!collapsed && <span className="font-semibold">{loggingOut ? 'Keluar...' : 'Logout'}</span>}
          </button>
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

      {/* ── Dialog Konfirmasi Logout ── */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700">Logout</span>
                <p className="text-xs text-ink-400 mt-0.5">Anda akan keluar dari sistem</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Yakin ingin logout? Anda perlu login kembali untuk mengakses dashboard.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 h-9 rounded-lg border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
              >
                {loggingOut
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Keluar...</>
                  : 'Ya, Logout'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}