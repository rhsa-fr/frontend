'use client'

import Link from 'next/link'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  PiggyBank,
  Users,
  BarChart3,
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Pinjaman Masuk',
    value: '12',
    sub: 'Bulan ini',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    label: 'Menunggu Persetujuan',
    value: '4',
    sub: 'Perlu tindakan',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    label: 'Disetujui',
    value: '7',
    sub: 'Bulan ini',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Ditolak',
    value: '1',
    sub: 'Bulan ini',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
]

// Simpanan data for mini chart (last 6 months)
const SIMPANAN_TREND = [
  { month: 'Okt', nilai: 420 },
  { month: 'Nov', nilai: 438 },
  { month: 'Des', nilai: 455 },
  { month: 'Jan', nilai: 462 },
  { month: 'Feb', nilai: 471 },
  { month: 'Mar', nilai: 483 },
]

const MAX_VAL = Math.max(...SIMPANAN_TREND.map((d) => d.nilai))

const PINJAMAN_PENGAJUAN = [
  {
    id: 'PIN-2024-0042',
    nama: 'Ahmad Fauzi',
    nominal: 'Rp 15.000.000',
    keperluan: 'Modal usaha',
    tanggal: '11 Mar 2025',
    status: 'menunggu',
  },
  {
    id: 'PIN-2024-0043',
    nama: 'Dewi Rahayu',
    nominal: 'Rp 8.500.000',
    keperluan: 'Renovasi rumah',
    tanggal: '11 Mar 2025',
    status: 'menunggu',
  },
  {
    id: 'PIN-2024-0044',
    nama: 'Hendra Kusuma',
    nominal: 'Rp 22.000.000',
    keperluan: 'Pembelian kendaraan',
    tanggal: '12 Mar 2025',
    status: 'menunggu',
  },
  {
    id: 'PIN-2024-0041',
    nama: 'Rina Wati',
    nominal: 'Rp 5.000.000',
    keperluan: 'Pendidikan anak',
    tanggal: '10 Mar 2025',
    status: 'menunggu',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardKetuaPage() {
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-blue-700 to-blue-500 border-blue-600 p-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-blue-100 mb-1">Panel Ketua</p>
          <h1 className="text-xl font-semibold text-white">Selamat datang, Ketua</h1>
          <p className="text-sm text-blue-100 mt-1">Monitor pinjaman dan simpanan koperasi.</p>
        </div>
        <BarChart3 className="hidden sm:block w-10 h-10 text-white opacity-30" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`${s.color} w-[18px] h-[18px]`} />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-ink-800 mt-0.5">{s.value}</p>
              <p className="text-[10px] text-ink-300 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Grafik Simpanan */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Grafik Simpanan</h2>
              <p className="text-[11px] text-ink-300 mt-0.5">6 bulan terakhir (juta)</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              +2.5%
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-2 h-32 pt-2">
            {SIMPANAN_TREND.map((d, i) => {
              const isLast = i === SIMPANAN_TREND.length - 1
              const height = Math.round((d.nilai / MAX_VAL) * 100)
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className="text-[10px] font-semibold text-ink-600">{isLast ? d.nilai : ''}</p>
                  <div className="w-full relative flex items-end" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isLast ? 'bg-ink-800' : 'bg-surface-300'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-ink-300">{d.month}</p>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-200">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
              <div>
                <p className="text-[10px] text-ink-300">Total Simpanan</p>
                <p className="text-xs font-semibold text-ink-800">Rp 482,5 Jt</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <div>
                <p className="text-[10px] text-ink-300">Anggota Aktif</p>
                <p className="text-xs font-semibold text-ink-800">231 orang</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Pengajuan Pinjaman */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Pengajuan Pinjaman</h2>
              <p className="text-[11px] text-ink-300 mt-0.5">Memerlukan persetujuan Anda</p>
            </div>
            <Link href="/dashboard/pinjaman" className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
              Lihat semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {PINJAMAN_PENGAJUAN.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-surface-50 
                           border border-surface-200 hover:border-surface-300 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-ink-800">{p.nama}</p>
                    <span className="text-[10px] text-ink-300 font-mono">{p.id}</span>
                  </div>
                  <p className="text-xs text-ink-400">{p.keperluan}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-ink-800">{p.nominal}</span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-300">
                      <Clock className="w-3 h-3" /> {p.tanggal}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 
                               text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    title="Setujui pinjaman"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Setuju
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 
                               text-xs font-semibold border border-red-200 hover:bg-red-100 transition-colors"
                    title="Tolak pinjaman"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Alert hint */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Terdapat <strong>4 pengajuan</strong> yang menunggu keputusan Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Pinjaman trend mini row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Pinjaman Aktif', value: 'Rp 215,0 Jt', trend: '+4.5 Jt', up: true, icon: CreditCard },
          { label: 'Rata-rata Pinjaman', value: 'Rp 12,5 Jt', trend: 'Per anggota', up: true, icon: TrendingUp },
          { label: 'Pinjaman Jatuh Tempo', value: '7 angsuran', trend: 'Hari ini', up: false, icon: TrendingDown },
        ].map((item) => (
          <div key={item.label} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-ink-400" />
            </div>
            <div>
              <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{item.label}</p>
              <p className="text-base font-bold text-ink-800">{item.value}</p>
              <p className={`text-[11px] font-medium mt-0.5 ${item.up ? 'text-emerald-600' : 'text-amber-500'}`}>
                {item.trend}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}