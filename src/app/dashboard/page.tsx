'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, PiggyBank, CreditCard, Receipt, TrendingUp,
  ArrowUpRight, Clock, AlertCircle, CheckCircle2, RefreshCw,
  ArrowDownCircle, ArrowUpCircle, ChevronRight, UserCheck,
  BarChart2,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Skeleton from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
interface PaginatedMeta {
  total: number; page: number; total_pages: number; skip: number; limit: number
}
interface AnggotaItem {
  id_anggota: number; no_anggota: string; nama_lengkap: string
  tanggal_bergabung: string; status: 'aktif' | 'non-aktif' | 'keluar'; created_at: string
}
interface PinjamanItem {
  id_pinjaman: number; no_pinjaman: string; nama_anggota?: string
  tanggal_pengajuan: string; nominal_pinjaman: number; total_pinjaman: number
  sisa_pinjaman: number; status: string; created_at: string
}
interface SimpananItem {
  id_simpanan: number; no_transaksi: string; nama_anggota?: string
  tipe_transaksi: 'setor' | 'tarik'; nominal: number; saldo_akhir: number
  tanggal_transaksi: string; nama_jenis_simpanan?: string
}
interface AngsuranItem {
  id_angsuran: number; no_angsuran: string; no_pinjaman?: string
  nama_anggota?: string; tanggal_jatuh_tempo: string
  nominal_angsuran: number; total_bayar?: number; denda: number
  status: string; angsuran_ke: number; tanggal_bayar?: string
}
interface Stats {
  totalAnggota: number; anggotaAktif: number; anggotaBaru: number
  totalSimpanan: number; simpananBulanIni: number
  totalPinjaman: number; pinjamanPending: number; pinjamanAktif: number
  angsuranJatuhTempo: number; angsuranTerlambat: number
}
interface ChartData {
  bulan: string
  setor: number
  tarik: number
  angsuran: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} Jt`
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} Rb`
  return `Rp ${n}`
}

const thisMo = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px]">
      <p className="font-semibold text-ink-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
            <span className="text-ink-500">{entry.name}</span>
          </div>
          <span className="font-bold text-ink-800">{fmtCompact(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, bg, loading, href, router,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType
  color: string; bg: string; loading: boolean; href?: string
  router: ReturnType<typeof useRouter>
}) {
  return (
    <div
      onClick={() => href && router.push(href)}
      className={cn(
        "stat-card group cursor-pointer hover-lift hover-glow",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        href && "hover:shadow-xl hover:-translate-y-1",
        !href && "cursor-default"
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform duration-500 group-hover:rotate-12",
          bg
        )}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        {href && (
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          )}
        </div>
        {sub && !loading && (
          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Alert Row ─────────────────────────────────────────────────────────────────
function AlertRow({ icon: Icon, color, label, count, loading, href, router }: {
  icon: React.ElementType; color: string; label: string; count: number
  loading: boolean; href: string; router: ReturnType<typeof useRouter>
}) {
  return (
    <button
      onClick={() => router.push(href)}
      className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-md hover-lift hover-glow transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl transition-colors duration-300", "bg-slate-50 group-hover:bg-indigo-50")}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <p className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 text-left transition-colors">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="w-8 h-5 rounded-lg" />
      ) : (
        <span className="text-[11px] font-bold text-slate-900 bg-white border border-slate-100 rounded-lg px-2.5 py-1 shadow-sm group-hover:border-indigo-200 group-hover:shadow-indigo-100/50 transition-all">
          {count}
        </span>
      )}
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [stats, setStats]                   = useState<Stats | null>(null)
  const [recentSimpanan, setRecentSimpanan] = useState<SimpananItem[]>([])
  const [recentPinjaman, setRecentPinjaman] = useState<PinjamanItem[]>([])
  const [jatuhTempo, setJatuhTempo]         = useState<AngsuranItem[]>([])
  const [chartData, setChartData]           = useState<ChartData[]>([])
  const [chartMode, setChartMode]           = useState<'bar' | 'line'>('bar')
  const [loading, setLoading]               = useState(true)
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const months = getLast6Months()

      const [
        anggotaAll, anggotaAktif, anggotaBaru,
        simpananBulan, pinjamanPending, pinjamanAktif,
        angsuranJatuhTempo, angsuranTerlambat,
        recentSmp, recentPnj, angsuranJT,
        simpananChart, angsuranChart,
      ] = await Promise.allSettled([
        api.get<{ data: AnggotaItem[]; meta: PaginatedMeta }>('/anggota?limit=1'),
        api.get<{ data: AnggotaItem[]; meta: PaginatedMeta }>('/anggota?status=aktif&limit=1'),
        api.get<{ data: AnggotaItem[]; meta: PaginatedMeta }>('/anggota?limit=100'),
        api.get<{ data: SimpananItem[]; meta: PaginatedMeta }>('/simpanan?limit=200'),
        api.get<{ data: PinjamanItem[]; meta: PaginatedMeta }>('/pinjaman?status=menunggu&limit=1'),
        api.get<{ data: PinjamanItem[]; meta: PaginatedMeta }>('/pinjaman?status=disetujui&limit=1'),
        api.get<{ data: AngsuranItem[]; meta: PaginatedMeta }>('/angsuran?status=belum_bayar&limit=1'),
        api.get<{ data: AngsuranItem[]; meta: PaginatedMeta }>('/angsuran?status=terlambat&limit=1'),
        api.get<{ data: SimpananItem[]; meta: PaginatedMeta }>('/simpanan?limit=5'),
        api.get<{ data: PinjamanItem[]; meta: PaginatedMeta }>('/pinjaman?limit=5'),
        api.get<{ data: AngsuranItem[]; meta: PaginatedMeta }>('/angsuran?status=belum_bayar&limit=5'),
        api.get<{ data: SimpananItem[]; meta: PaginatedMeta }>('/simpanan?limit=500'),
        api.get<{ data: AngsuranItem[]; meta: PaginatedMeta }>('/angsuran?limit=500'),
      ])

      const mo = thisMo()
      let anggotaBaruCount = 0
      if (anggotaBaru.status === 'fulfilled') {
        anggotaBaruCount = (anggotaBaru.value.data ?? []).filter(
          (a: AnggotaItem) => a.tanggal_bergabung?.startsWith(mo) || a.created_at?.startsWith(mo)
        ).length
      }

      let totalSimpanan = 0, simpananBulanIni = 0
      const allSimpananTxs: SimpananItem[] = simpananBulan.status === 'fulfilled'
        ? (simpananBulan.value.data ?? []) : []
      allSimpananTxs.forEach((t: SimpananItem) => {
        const val = t.tipe_transaksi === 'setor' ? t.nominal : -t.nominal
        totalSimpanan += val
        if (t.tanggal_transaksi?.startsWith(mo)) simpananBulanIni += val
      })

      let totalPinjaman = 0
      try {
        const pAll = await api.get<{ data: PinjamanItem[]; meta: PaginatedMeta }>('/pinjaman?status=disetujui&limit=200')
        totalPinjaman = (pAll.data ?? []).reduce((sum: number, p: PinjamanItem) => sum + (p.sisa_pinjaman ?? 0), 0)
      } catch { totalPinjaman = 0 }

      setStats({
        totalAnggota:       anggotaAll.status === 'fulfilled' ? anggotaAll.value.meta?.total ?? 0 : 0,
        anggotaAktif:       anggotaAktif.status === 'fulfilled' ? anggotaAktif.value.meta?.total ?? 0 : 0,
        anggotaBaru:        anggotaBaruCount,
        totalSimpanan:      Math.max(totalSimpanan, 0),
        simpananBulanIni:   Math.max(simpananBulanIni, 0),
        totalPinjaman,
        pinjamanPending:    pinjamanPending.status === 'fulfilled' ? pinjamanPending.value.meta?.total ?? 0 : 0,
        pinjamanAktif:      pinjamanAktif.status === 'fulfilled' ? pinjamanAktif.value.meta?.total ?? 0 : 0,
        angsuranJatuhTempo: angsuranJatuhTempo.status === 'fulfilled' ? angsuranJatuhTempo.value.meta?.total ?? 0 : 0,
        angsuranTerlambat:  angsuranTerlambat.status === 'fulfilled' ? angsuranTerlambat.value.meta?.total ?? 0 : 0,
      })

      if (recentSmp.status === 'fulfilled') setRecentSimpanan(recentSmp.value.data ?? [])
      if (recentPnj.status === 'fulfilled') setRecentPinjaman(recentPnj.value.data ?? [])
      if (angsuranJT.status === 'fulfilled') setJatuhTempo(angsuranJT.value.data ?? [])

      // ── Build chart data ────────────────────────────────────────────────
      const smpTxs: SimpananItem[] = simpananChart.status === 'fulfilled'
        ? (simpananChart.value.data ?? []) : []
      const angTxs: AngsuranItem[] = angsuranChart.status === 'fulfilled'
        ? (angsuranChart.value.data ?? []) : []

      const built: ChartData[] = months.map(ym => {
        const smpBulan = smpTxs.filter(s => s.tanggal_transaksi?.startsWith(ym))
        const angBulan = angTxs.filter(a => a.tanggal_bayar?.startsWith(ym))
        const setor    = smpBulan.filter(s => s.tipe_transaksi === 'setor').reduce((s, t) => s + t.nominal, 0)
        const tarik    = smpBulan.filter(s => s.tipe_transaksi === 'tarik').reduce((s, t) => s + t.nominal, 0)
        const angsuran = angBulan.reduce((s, a) => s + (a.total_bayar ?? a.nominal_angsuran ?? 0), 0)
        return { bulan: monthLabel(ym), setor, tarik, angsuran }
      })
      setChartData(built)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const statCards = stats ? [
    {
      label: 'Total Anggota',
      value: stats.totalAnggota.toLocaleString('id-ID'),
      sub: `${stats.anggotaAktif} aktif · ${stats.anggotaBaru} baru bulan ini`,
      icon: Users, color: 'text-[#2A7FC5]', bg: 'bg-blue-50',
      href: '/dashboard/anggota',
    },
    {
      label: 'Total Simpanan',
      value: fmtCompact(stats.totalSimpanan),
      sub: stats.simpananBulanIni > 0
        ? `+${fmtCompact(stats.simpananBulanIni)} bulan ini`
        : 'Tidak ada transaksi bulan ini',
      icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50',
      href: '/dashboard/simpanan',
    },
    {
      label: 'Pinjaman Aktif',
      value: fmtCompact(stats.totalPinjaman),
      sub: `${stats.pinjamanAktif} pinjaman berjalan`,
      icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50',
      href: '/dashboard/pinjaman',
    },
    {
      label: 'Angsuran Bermasalah',
      value: (stats.angsuranJatuhTempo + stats.angsuranTerlambat).toLocaleString('id-ID'),
      sub: `${stats.angsuranTerlambat} terlambat · ${stats.angsuranJatuhTempo} belum bayar`,
      icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50',
      href: '/dashboard/angsuran',
    },
  ] : []

  const alertItems = stats ? [
    { icon: Clock,        color: 'text-amber-500',   label: 'Pinjaman menunggu persetujuan', count: stats.pinjamanPending,    href: '/dashboard/pinjaman' },
    { icon: AlertCircle,  color: 'text-red-500',     label: 'Angsuran terlambat',            count: stats.angsuranTerlambat,  href: '/dashboard/angsuran' },
    { icon: UserCheck,    color: 'text-blue-600',    label: 'Angsuran belum bayar',          count: stats.angsuranJatuhTempo, href: '/dashboard/angsuran' },
    { icon: CheckCircle2, color: 'text-emerald-500', label: 'Anggota baru bulan ini',        count: stats.anggotaBaru,        href: '/dashboard/anggota'  },
  ] : []

  const STATUS_PINJAMAN: Record<string, { label: string; cls: string }> = {
    menunggu:  { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-700'    },
    pending:   { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-700'    },
    disetujui: { label: 'Disetujui', cls: 'bg-blue-50 text-[#1A2F4A]'      },
    ditolak:   { label: 'Ditolak',   cls: 'bg-red-50 text-red-600'        },
    lunas:     { label: 'Lunas',     cls: 'bg-emerald-50 text-emerald-700' },
  }
  const STATUS_ANGSURAN: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: 'Belum Bayar', cls: 'bg-amber-50 text-amber-700'    },
    terlambat:   { label: 'Terlambat',   cls: 'bg-red-50 text-red-600'        },
    lunas:       { label: 'Lunas',       cls: 'bg-emerald-50 text-emerald-700' },
  }

  const hasChartData = chartData.some(d => d.setor > 0 || d.tarik > 0 || d.angsuran > 0)

  // Config warna & label series
  const series = [
    { key: 'setor',    name: 'Setor',    color: '#2A7FC5' }, // Blue dari button
    { key: 'tarik',    name: 'Tarik',    color: '#f87171' }, // Red (tetap)
    { key: 'angsuran', name: 'Angsuran', color: '#1A2F4A' }, // Navy dari button
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat datang, <span className="text-[#2A7FC5]">
              {user?.role 
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1) 
                : user?.username.split('@')[0]}
            </span> 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {lastUpdated
              ? `Terakhir diperbarui: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
              : 'Sinkronisasi data...'}
          </p>
        </div>
        <button
          onClick={loadAll} disabled={loading}
          className="inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1A2F4A 0%, #2A7FC5 100%)' }}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh Data
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="stat-card">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="space-y-1.5 mt-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          : statCards.map((s, i) => (
              <div key={s.label} className={cn("animate-slide-up", `stagger-${i+1}`)}>
                <StatCard {...s} loading={false} router={router} />
              </div>
            ))
        }
      </div>

      {/* ── Grafik Ringkasan Keuangan ── */}
      <div className="card animate-scale-in stagger-3">
        {/* Header grafik */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Ringkasan Keuangan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Simpanan & angsuran 6 bulan terakhir</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Legend */}
            <div className="flex items-center gap-4">
              {series.map(s => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: s.color }} />
                  <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-tight">{s.name}</span>
                </div>
              ))}
            </div>

            {/* Toggle Bar / Line */}
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
              <button
                onClick={() => setChartMode('bar')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all",
                  chartMode === 'bar' ? "bg-white text-[#1A2F4A] shadow-md" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Bar
              </button>
              <button
                onClick={() => setChartMode('line')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                  chartMode === 'line' ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Line
              </button>
            </div>
          </div>
        </div>

        {/* Chart body */}
        {loading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : !hasChartData ? (
          <div className="h-56 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-ink-200 mb-2" />
            <p className="text-sm text-ink-400">Belum ada data transaksi</p>
            <p className="text-xs text-ink-300 mt-1">Data akan muncul setelah ada transaksi simpanan dan angsuran</p>
          </div>
        ) : chartMode === 'bar' ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}Jt` : `${(v / 1_000).toFixed(0)}Rb`}
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
              {series.map(s => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}Jt` : `${(v / 1_000).toFixed(0)}Rb`}
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              {series.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: s.color, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Body: 2 kolom ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Kiri (2/3) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Transaksi Simpanan Terbaru */}
          <div className="card animate-fade-in stagger-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Aktivitas Simpanan</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 tracking-wide uppercase">Transaksi 5 Terakhir</p>
              </div>
              <button onClick={() => router.push('/dashboard/simpanan')}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #1A2F4A 0%, #2A7FC5 100%)' }}>
                Lihat Semua
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            ) : recentSimpanan.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                  <PiggyBank className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Belum Ada Transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSimpanan.map(t => (
                  <div key={t.id_simpanan} className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                      t.tipe_transaksi === 'setor' ? 'bg-emerald-50' : 'bg-rose-50'
                    )}>
                      {t.tipe_transaksi === 'setor'
                        ? <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
                        : <ArrowUpCircle  className="w-6 h-6 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.nama_anggota ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.nama_jenis_simpanan ?? '—'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-medium text-slate-500 italic">{t.tanggal_transaksi}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-[15px] font-bold tracking-tight",
                        t.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-rose-500'
                      )}>
                        {t.tipe_transaksi === 'tarik' ? '−' : '+'}{fmtCompact(t.nominal)}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mt-0.5">Berhasil</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pinjaman Terbaru */}
          <div className="card animate-fade-in stagger-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Daftar Pinjaman</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 tracking-wide uppercase">Pengajuan Terbaru</p>
              </div>
              <button onClick={() => router.push('/dashboard/pinjaman')}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #1A2F4A 0%, #2A7FC5 100%)' }}>
                Kelola Pinjaman
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
              </div>
            ) : recentPinjaman.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Belum Ada Pengajuan</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['No. Pinjaman', 'Anggota', 'Nominal', 'Status'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] py-4 pr-4 border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[13px]">
                    {recentPinjaman.map(p => {
                      const sc = STATUS_PINJAMAN[p.status] ?? STATUS_PINJAMAN.menunggu
                      return (
                        <tr key={p.id_pinjaman} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-4 font-mono text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">{p.no_pinjaman}</td>
                          <td className="py-4 pr-4 font-semibold text-slate-700 whitespace-nowrap">{p.nama_anggota ?? '—'}</td>
                          <td className="py-4 pr-4">
                             <p className="font-bold text-slate-900 truncate">{fmtCompact(p.nominal_pinjaman)}</p>
                             <p className="text-[10px] font-semibold text-rose-500 mt-0.5">Sisa: {fmtCompact(p.sisa_pinjaman)}</p>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm inline-block",
                              sc.cls.replace('bg-', 'bg-').replace('text-', 'text-')
                            )}>
                              {sc.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Kanan (1/3) */}
        <div className="space-y-4">

          {/* Perlu Perhatian */}
          <div className="card h-fit animate-fade-in stagger-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Perlu Perhatian</h2>
            <div className="space-y-3">
              {loading
                ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)
                : alertItems.map(item => (
                    <AlertRow key={item.label} {...item} loading={false} router={router} />
                  ))
              }
            </div>
          </div>

          {/* Angsuran Belum Bayar */}
          <div className="card h-fit animate-fade-in stagger-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Tagihan Pending</h2>
              <button onClick={() => router.push('/dashboard/angsuran')}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all">
                Semua
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : jatuhTempo.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-400 italic">Semua angsuran lancar ✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jatuhTempo.map(a => (
                  <div key={a.id_angsuran} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/80 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.nama_anggota ?? '—'}</p>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
                        STATUS_ANGSURAN[a.status]?.cls ?? 'bg-slate-200 text-slate-400'
                      )}>
                        {STATUS_ANGSURAN[a.status]?.label ?? a.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">{a.no_pinjaman} · Ke-{a.angsuran_ke}</p>
                    <p className="text-[17px] font-bold text-rose-500 mt-2">{fmtCompact(a.nominal_angsuran)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}