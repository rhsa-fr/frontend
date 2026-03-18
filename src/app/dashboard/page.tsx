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
      className={`stat-card transition-all ${href ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={color} style={{ width: 18, height: 18 }} />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-ink-300" />}
      </div>
      <div>
        <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-24 mt-1" />
          : <p className="text-xl font-semibold text-ink-800 mt-0.5">{value}</p>
        }
        {sub && !loading && <p className="text-[11px] text-ink-300 mt-0.5">{sub}</p>}
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
      className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs text-ink-600 text-left">{label}</p>
      </div>
      {loading
        ? <Skeleton className="w-6 h-4 shadow-sm" />
        : <span className="text-xs font-bold text-ink-800 bg-white rounded-lg px-2 py-0.5 shadow-sm">{count}</span>
      }
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
      icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
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
    { icon: UserCheck,    color: 'text-blue-500',    label: 'Angsuran belum bayar',          count: stats.angsuranJatuhTempo, href: '/dashboard/angsuran' },
    { icon: CheckCircle2, color: 'text-emerald-500', label: 'Anggota baru bulan ini',        count: stats.anggotaBaru,        href: '/dashboard/anggota'  },
  ] : []

  const STATUS_PINJAMAN: Record<string, { label: string; cls: string }> = {
    menunggu:  { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-700'    },
    pending:   { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-700'    },
    disetujui: { label: 'Disetujui', cls: 'bg-blue-50 text-blue-700'      },
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
    { key: 'setor',    name: 'Setor',    color: '#10b981' },
    { key: 'tarik',    name: 'Tarik',    color: '#f87171' },
    { key: 'angsuran', name: 'Angsuran', color: '#6366f1' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink-800">
            Selamat datang, {user?.username} 👋
          </h1>
          <p className="text-xs text-ink-300 mt-0.5">
            {lastUpdated
              ? `Terakhir diperbarui: ${lastUpdated.toLocaleTimeString('id-ID')}`
              : 'Memuat data...'}
          </p>
        </div>
        <button
          onClick={loadAll} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-600 border border-surface-300 hover:bg-surface-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
          : statCards.map(s => (
              <StatCard key={s.label} {...s} loading={false} router={router} />
            ))
        }
      </div>

      {/* ── Grafik Ringkasan Keuangan ── */}
      <div className="card">
        {/* Header grafik */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-ink-800">Ringkasan Keuangan</h2>
            <p className="text-[11px] text-ink-300 mt-0.5">Simpanan & angsuran 6 bulan terakhir</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3">
              {series.map(s => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-[11px] text-ink-500 font-medium">{s.name}</span>
                </div>
              ))}
            </div>

            {/* Toggle Bar / Line */}
            <div className="flex items-center bg-surface-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setChartMode('bar')}
                title="Bar Chart"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  chartMode === 'bar'
                    ? 'bg-white text-ink-800 shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Bar
              </button>
              <button
                onClick={() => setChartMode('line')}
                title="Line Chart"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  chartMode === 'line'
                    ? 'bg-white text-ink-800 shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
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
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ink-800">Transaksi Simpanan Terbaru</h2>
              <button onClick={() => router.push('/dashboard/simpanan')}
                className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
                Lihat semua <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
              </div>
            ) : recentSimpanan.length === 0 ? (
              <p className="text-xs text-ink-300 text-center py-6">Belum ada transaksi simpanan</p>
            ) : (
              <div className="space-y-1">
                {recentSimpanan.map(t => (
                  <div key={t.id_simpanan} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${t.tipe_transaksi === 'setor' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {t.tipe_transaksi === 'setor'
                        ? <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                        : <ArrowUpCircle  className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-800 truncate">{t.nama_anggota ?? '—'}</p>
                      <p className="text-[10px] text-ink-300">{t.nama_jenis_simpanan ?? '—'} · {t.tanggal_transaksi}</p>
                    </div>
                    <p className={`text-xs font-bold shrink-0 ${t.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.tipe_transaksi === 'tarik' ? '−' : '+'}{fmtCompact(t.nominal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pinjaman Terbaru */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ink-800">Pinjaman Terbaru</h2>
              <button onClick={() => router.push('/dashboard/pinjaman')}
                className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
                Lihat semua <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
              </div>
            ) : recentPinjaman.length === 0 ? (
              <p className="text-xs text-ink-300 text-center py-6">Belum ada pinjaman</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-100">
                      {['No. Pinjaman', 'Anggota', 'Nominal', 'Sisa', 'Status'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider py-2 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {recentPinjaman.map(p => {
                      const sc = STATUS_PINJAMAN[p.status] ?? STATUS_PINJAMAN.menunggu
                      return (
                        <tr key={p.id_pinjaman} className="hover:bg-surface-50 transition-colors">
                          <td className="py-2.5 pr-4 font-mono text-[10px] text-ink-400 whitespace-nowrap">{p.no_pinjaman}</td>
                          <td className="py-2.5 pr-4 text-ink-700 font-medium whitespace-nowrap">{p.nama_anggota ?? '—'}</td>
                          <td className="py-2.5 pr-4 font-semibold text-ink-800 whitespace-nowrap">{fmtCompact(p.nominal_pinjaman)}</td>
                          <td className={`py-2.5 pr-4 font-bold whitespace-nowrap ${p.sisa_pinjaman > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {fmtCompact(p.sisa_pinjaman)}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>{sc.label}</span>
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
          <div className="card">
            <h2 className="text-sm font-semibold text-ink-800 mb-3">Perlu Perhatian</h2>
            <div className="space-y-2">
              {loading
                ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)
                : alertItems.map(item => (
                    <AlertRow key={item.label} {...item} loading={false} router={router} />
                  ))
              }
            </div>
          </div>

          {/* Angsuran Belum Bayar */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink-800">Angsuran Belum Bayar</h2>
              <button onClick={() => router.push('/dashboard/angsuran')}
                className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
                Semua <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : jatuhTempo.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1.5" />
                <p className="text-xs text-ink-400">Semua angsuran up to date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jatuhTempo.map(a => (
                  <div key={a.id_angsuran} className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-ink-800 truncate">{a.nama_anggota ?? '—'}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_ANGSURAN[a.status]?.cls ?? 'bg-surface-200 text-ink-400'}`}>
                        {STATUS_ANGSURAN[a.status]?.label ?? a.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-300">{a.no_pinjaman} · Ke-{a.angsuran_ke}</p>
                    <p className="text-xs font-bold text-red-500 mt-1">{fmtCompact(a.nominal_angsuran)}</p>
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