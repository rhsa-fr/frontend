'use client'

import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SALDO_CARDS = [
  {
    label: 'Saldo Kas Koperasi',
    value: 'Rp 267.300.000',
    sub: 'Per hari ini, 13 Mar 2025',
    icon: Wallet,
    prominent: true,
  },
  {
    label: 'Pemasukan Bulan Ini',
    value: 'Rp 48.750.000',
    sub: '+12% dari bulan lalu',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    trend: 'up',
  },
  {
    label: 'Pengeluaran Bulan Ini',
    value: 'Rp 31.200.000',
    sub: '-3% dari bulan lalu',
    icon: TrendingDown,
    color: 'text-red-500',
    bg: 'bg-red-50',
    trend: 'down',
  },
]

// Cashflow 7 hari terakhir (juta)
const CASHFLOW = [
  { day: 'Sen', masuk: 8.2, keluar: 4.5 },
  { day: 'Sel', masuk: 6.5, keluar: 3.2 },
  { day: 'Rab', masuk: 9.1, keluar: 5.8 },
  { day: 'Kam', masuk: 7.4, keluar: 4.1 },
  { day: 'Jum', masuk: 11.3, keluar: 6.5 },
  { day: 'Sab', masuk: 4.2, keluar: 2.1 },
  { day: 'Min', masuk: 2.0, keluar: 5.0 },
]

const MAX_CF = Math.max(...CASHFLOW.flatMap((d) => [d.masuk, d.keluar]))

// Angsuran jatuh tempo hari ini
const ANGSURAN_JATUH_TEMPO = [
  {
    id: 'ANG-2025-0182',
    no_pinjaman: 'PIN-2024-0018',
    nama: 'Ahmad Fauzi',
    nominal: 'Rp 750.000',
    ke: 5,
    dari: 24,
    status: 'belum_bayar',
  },
  {
    id: 'ANG-2025-0183',
    no_pinjaman: 'PIN-2024-0022',
    nama: 'Dewi Rahayu',
    nominal: 'Rp 1.200.000',
    ke: 12,
    dari: 36,
    status: 'belum_bayar',
  },
  {
    id: 'ANG-2025-0184',
    no_pinjaman: 'PIN-2024-0031',
    nama: 'Budi Santoso',
    nominal: 'Rp 550.000',
    ke: 2,
    dari: 12,
    status: 'lunas',
  },
  {
    id: 'ANG-2025-0185',
    no_pinjaman: 'PIN-2024-0035',
    nama: 'Siti Rahmawati',
    nominal: 'Rp 900.000',
    ke: 8,
    dari: 24,
    status: 'belum_bayar',
  },
  {
    id: 'ANG-2025-0186',
    no_pinjaman: 'PIN-2024-0040',
    nama: 'Eko Prasetyo',
    nominal: 'Rp 1.500.000',
    ke: 3,
    dari: 36,
    status: 'terlambat',
  },
  {
    id: 'ANG-2025-0187',
    no_pinjaman: 'PIN-2024-0041',
    nama: 'Rina Wati',
    nominal: 'Rp 625.000',
    ke: 6,
    dari: 12,
    status: 'lunas',
  },
]

const STATUS_STYLE: Record<string, { label: string; class: string; dot: string }> = {
  belum_bayar: { label: 'Belum Bayar', class: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  lunas: { label: 'Lunas', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  terlambat: { label: 'Terlambat', class: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
}

const totalBelumBayar = ANGSURAN_JATUH_TEMPO.filter((a) => a.status === 'belum_bayar').length
const totalTerlambat = ANGSURAN_JATUH_TEMPO.filter((a) => a.status === 'terlambat').length

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardBendaharaPage() {
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-emerald-700 to-emerald-500 border-emerald-600 p-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-emerald-100 mb-1">Panel Bendahara</p>
          <h1 className="text-xl font-semibold text-white">Selamat datang, Bendahara</h1>
          <p className="text-sm text-emerald-100 mt-1">Monitor kas, arus keuangan, dan angsuran koperasi.</p>
        </div>
        <DollarSign className="hidden sm:block w-10 h-10 text-white opacity-30" />
      </div>

      {/* Saldo & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SALDO_CARDS.map((s) =>
          s.prominent ? (
            <div key={s.label} className="card bg-ink-800 border-ink-700 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-200">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-ink-300">{s.sub}</p>
            </div>
          ) : (
            <div key={s.label} className="stat-card hover:shadow-md">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`${s.color} w-[18px] h-[18px]`} />
              </div>
              <div>
                <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-lg font-bold text-ink-800 mt-0.5">{s.value}</p>
                <p className={`text-[11px] font-medium mt-0.5 ${s.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.sub}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Cashflow + Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Grafik Arus Kas */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Grafik Arus Kas</h2>
              <p className="text-[11px] text-ink-300 mt-0.5">7 hari terakhir (juta Rupiah)</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-ink-800 inline-block" />
                Masuk
              </span>
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-surface-300 inline-block" />
                Keluar
              </span>
            </div>
          </div>

          {/* Grouped Bar Chart */}
          <div className="flex items-end gap-3 h-36 pt-2">
            {CASHFLOW.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end gap-0.5" style={{ height: '90px' }}>
                  {/* Bar Masuk */}
                  <div
                    className="flex-1 rounded-t-sm bg-ink-800 transition-all duration-500"
                    style={{ height: `${Math.round((d.masuk / MAX_CF) * 100)}%` }}
                    title={`Masuk: ${d.masuk}Jt`}
                  />
                  {/* Bar Keluar */}
                  <div
                    className="flex-1 rounded-t-sm bg-surface-300 transition-all duration-500"
                    style={{ height: `${Math.round((d.keluar / MAX_CF) * 100)}%` }}
                    title={`Keluar: ${d.keluar}Jt`}
                  />
                </div>
                <p className="text-[10px] text-ink-300">{d.day}</p>
              </div>
            ))}
          </div>

          {/* Cashflow Summary */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-200">
            {[
              { label: 'Total Masuk', val: 'Rp 48.7 Jt', icon: ArrowUpRight, color: 'text-emerald-600' },
              { label: 'Total Keluar', val: 'Rp 31.2 Jt', icon: ArrowDownRight, color: 'text-red-500' },
              { label: 'Net Cashflow', val: '+Rp 17.5 Jt', icon: TrendingUp, color: 'text-blue-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                <div>
                  <p className="text-[10px] text-ink-300">{item.label}</p>
                  <p className="text-xs font-semibold text-ink-800">{item.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Box */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-ink-800">Ringkasan Hari Ini</h2>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">{totalBelumBayar} Angsuran Belum Bayar</p>
                <p className="text-[11px] text-amber-600">Jatuh tempo hari ini</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">{totalTerlambat} Angsuran Terlambat</p>
                <p className="text-[11px] text-red-500">Perlu penagihan segera</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">2 Angsuran Lunas</p>
                <p className="text-[11px] text-emerald-600">Sudah dikonfirmasi</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-ink-300" />
              <p className="text-[11px] text-ink-300 font-medium">Kamis, 13 Maret 2025</p>
            </div>
            <Link
              href="/dashboard/angsuran"
              className="flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-ink-800 text-white 
                         text-xs font-semibold hover:bg-ink-700 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Kelola Angsuran
            </Link>
          </div>
        </div>
      </div>

      {/* Daftar Jatuh Tempo Hari Ini */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-800">Jatuh Tempo Angsuran Hari Ini</h2>
            <p className="text-[11px] text-ink-300 mt-0.5">{ANGSURAN_JATUH_TEMPO.length} angsuran terdaftar</p>
          </div>
          <Link href="/dashboard/angsuran" className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
            Semua angsuran <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200">
                {['No. Angsuran', 'Anggota', 'Nominal', 'Angsuran Ke', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider pb-2.5 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {ANGSURAN_JATUH_TEMPO.map((a) => {
                const s = STATUS_STYLE[a.status]
                return (
                  <tr key={a.id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-ink-500">{a.id}</td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-ink-800">{a.nama}</p>
                      <p className="text-[10px] text-ink-300">{a.no_pinjaman}</p>
                    </td>
                    <td className="py-3 pr-4 font-bold text-ink-800">{a.nominal}</td>
                    <td className="py-3 pr-4 text-ink-500">
                      {a.ke} / {a.dari}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3">
                      {a.status !== 'lunas' ? (
                        <button className="px-2.5 py-1 rounded-lg bg-ink-800 text-white text-[11px] font-semibold 
                                           hover:bg-ink-700 transition-colors flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Bayar
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}