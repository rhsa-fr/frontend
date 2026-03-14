'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  PiggyBank,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Settings,
  FileBarChart2,
  CreditCard,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Total Anggota',
    value: '248',
    sub: '+12 bulan ini',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    positive: true,
  },
  {
    label: 'Anggota Aktif',
    value: '231',
    sub: '93% dari total',
    icon: UserCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    positive: true,
  },
  {
    label: 'Anggota Non-Aktif',
    value: '17',
    sub: '7% dari total',
    icon: UserX,
    color: 'text-red-500',
    bg: 'bg-red-50',
    positive: false,
  },
  {
    label: 'Total Simpanan',
    value: 'Rp 482,5 Jt',
    sub: '+Rp 8.2 Jt bulan ini',
    icon: PiggyBank,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    positive: true,
  },
]

const QUICK_MENUS = [
  { label: 'Tambah Anggota', href: '/dashboard/anggota', icon: Users, desc: 'Daftarkan anggota baru' },
  { label: 'Kelola User', href: '/dashboard/user', icon: ShieldCheck, desc: 'Manajemen akun sistem' },
  { label: 'Jenis Simpanan', href: '/dashboard/jenis-simpanan', icon: PiggyBank, desc: 'Atur produk simpanan' },
  { label: 'Laporan', href: '/dashboard/laporan', icon: FileBarChart2, desc: 'Lihat semua laporan' },
  { label: 'Pinjaman', href: '/dashboard/pinjaman', icon: CreditCard, desc: 'Kelola data pinjaman' },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings, desc: 'Konfigurasi sistem' },
]

const RECENT_USERS = [
  { name: 'Budi Santoso', role: 'bendahara', status: 'aktif', created: '2 jam lalu' },
  { name: 'Siti Rahma', role: 'ketua', status: 'aktif', created: '1 hari lalu' },
  { name: 'Eko Prasetyo', role: 'admin', status: 'aktif', created: '3 hari lalu' },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700',
  ketua: 'bg-blue-100 text-blue-700',
  bendahara: 'bg-amber-100 text-amber-700',
}

const ACTIVITY_LOG = [
  { text: 'Anggota baru didaftarkan: Ahmad Fauzi', time: '09:12', icon: CheckCircle2, color: 'text-emerald-500' },
  { text: 'Password direset untuk user: siti_rahma', time: '08:45', icon: AlertCircle, color: 'text-amber-500' },
  { text: 'Jenis simpanan baru ditambahkan', time: '08:20', icon: Activity, color: 'text-blue-500' },
  { text: 'Ekspor data anggota berhasil', time: '07:55', icon: CheckCircle2, color: 'text-emerald-500' },
  { text: '3 anggota dinonaktifkan', time: 'Kemarin', icon: Clock, color: 'text-ink-300' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardAdminPage() {
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header Banner */}
      <div className="card bg-ink-800 border-ink-700 p-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-300 mb-1">Panel Administrator</p>
          <h1 className="text-xl font-semibold text-white">Selamat datang, Admin</h1>
          <p className="text-sm text-ink-300 mt-1">Kelola seluruh data dan pengguna sistem koperasi.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <ShieldCheck className="w-10 h-10 text-ink-300 opacity-40" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`${s.color} w-[18px] h-[18px]`} />
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-medium ${s.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                <TrendingUp className="w-3 h-3" />
                {s.sub}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-semibold text-ink-800 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Menu */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-800">Menu Cepat</h2>
            <span className="text-[11px] text-ink-300">Akses fitur utama</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_MENUS.map((menu) => (
              <Link
                key={menu.label}
                href={menu.href}
                className="group flex flex-col gap-2.5 p-4 rounded-xl border border-surface-300 bg-surface-50 
                           hover:border-ink-800 hover:bg-ink-800 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-white/10 border border-surface-300 
                                group-hover:border-white/20 flex items-center justify-center transition-all">
                  <menu.icon className="w-4 h-4 text-ink-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-800 group-hover:text-white transition-colors">{menu.label}</p>
                  <p className="text-[10px] text-ink-300 group-hover:text-ink-200 mt-0.5 transition-colors">{menu.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-800">Log Aktivitas</h2>
            <button className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
              Semua <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {ACTIVITY_LOG.map((log, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <log.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${log.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-600 leading-tight">{log.text}</p>
                  <p className="text-[10px] text-ink-300 mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Manajemen User</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800 text-white text-xs font-medium
                             hover:bg-ink-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Tambah User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider pb-2.5">Username</th>
                <th className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider pb-2.5">Role</th>
                <th className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider pb-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider pb-2.5">Dibuat</th>
                <th className="pb-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {RECENT_USERS.map((u, i) => (
                <tr key={i} className="hover:bg-surface-50 transition-colors">
                  <td className="py-3 font-medium text-ink-800">{u.name}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${ROLE_COLORS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-ink-600 capitalize">{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-ink-400">{u.created}</td>
                  <td className="py-3 text-right">
                    <button className="text-accent-600 hover:underline text-[11px] font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/dashboard/user" className="flex items-center gap-1 text-[11px] text-accent-600 hover:underline font-medium w-fit">
          Lihat semua user <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}