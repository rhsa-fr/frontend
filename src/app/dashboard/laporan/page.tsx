'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank,
  ChevronLeft, ChevronRight, Download, Printer, RefreshCw,
  BarChart3, FileText, Search, ArrowUpCircle, ArrowDownCircle,
  BadgeCheck, AlertTriangle, CalendarDays, Filter,
} from 'lucide-react'
import { api } from '@/lib/axios'

// ─── Types ──────────────────────────────────────────────────────────────────
interface SimpananTx {
  id_simpanan: number
  id_anggota: number
  nama_anggota?: string
  id_jenis_simpanan: number
  nama_jenis_simpanan?: string
  no_transaksi: string
  tanggal_transaksi: string
  tipe_transaksi: 'setor' | 'tarik'
  nominal: number
  saldo_akhir: number
  keterangan?: string
}

interface PinjamanItem {
  id_pinjaman: number
  id_anggota: number
  nama_anggota?: string
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  bunga_persen: number
  total_pinjaman: number
  lama_angsuran: number
  nominal_angsuran: number
  status: string
  sisa_pinjaman: number
  tanggal_persetujuan?: string
}

interface AngsuranTx {
  id_angsuran: number
  id_pinjaman: number
  no_pinjaman?: string
  no_angsuran: string
  angsuran_ke: number
  tanggal_jatuh_tempo: string
  tanggal_bayar?: string
  nominal_angsuran: number
  denda: number
  total_bayar: number
  status: string
  nama_anggota?: string
}

interface RekapBulan {
  bulan: string        // "YYYY-MM"
  labelBulan: string   // "Januari 2026"
  totalSetor: number
  totalTarik: number
  netSimpanan: number
  totalAngsuranDiterima: number
  totalDenda: number
  txSimpanan: number
  txAngsuran: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtCompact = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} Jt`
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} Rb`
  return fmt(n)
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  const nama = new Date(+y, +m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  return nama.charAt(0).toUpperCase() + nama.slice(1)
}

const getMonthsBack = (n: number): string[] => {
  const months: string[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

const currentYM = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function LaporanCard({ label, value, sub, icon: Icon, color, bg, trend }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color: string; bg: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={color} style={{ width: 18, height: 18 }} />
        </div>
        {trend === 'up'   && <TrendingUp   className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown  className="w-4 h-4 text-red-500" />}
      </div>
      <div>
        <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-semibold text-ink-800 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-ink-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Bar mini chart ───────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const printRef = useRef<HTMLDivElement>(null)

  // Tab state
  const [tab, setTab] = useState<'rekap' | 'pinjaman'>('rekap')

  // Filter
  const [bulanDipilih, setBulanDipilih] = useState(currentYM())
  const [searchPinjaman, setSearchPinjaman] = useState('')
  const [filterStatusPinjaman, setFilterStatusPinjaman] = useState('disetujui')

  // Data
  const [rekapList, setRekapList]     = useState<RekapBulan[]>([])
  const [simpananBulan, setSimpananBulan] = useState<SimpananTx[]>([])
  const [angsuranBulan, setAngsuranBulan] = useState<AngsuranTx[]>([])
  const [pinjamanList, setPinjamanList]   = useState<PinjamanItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ── Load rekap 6 bulan ──────────────────────────────────────────────────
  const loadRekap = useCallback(async () => {
    setLoading(true)
    try {
      const months = getMonthsBack(6)

      // Fetch semua simpanan (limit besar untuk coverage)
      const [smpRes, angRes] = await Promise.all([
        api.get<{ data: SimpananTx[] }>('/simpanan?limit=500'),
        api.get<{ data: AngsuranTx[] }>('/angsuran?status=lunas&limit=500'),
      ])
      const allSmp: SimpananTx[] = smpRes.data ?? []
      const allAng: AngsuranTx[] = angRes.data ?? []

      // Kelompokkan per bulan
      const rekap: RekapBulan[] = months.map(ym => {
        const smpBulan = allSmp.filter(s => s.tanggal_transaksi?.startsWith(ym))
        const angBulan = allAng.filter(a => a.tanggal_bayar?.startsWith(ym))

        const totalSetor = smpBulan.filter(s => s.tipe_transaksi === 'setor').reduce((sum, s) => sum + s.nominal, 0)
        const totalTarik = smpBulan.filter(s => s.tipe_transaksi === 'tarik').reduce((sum, s) => sum + s.nominal, 0)
        const totalAngsuran = angBulan.reduce((sum, a) => sum + a.total_bayar, 0)
        const totalDenda    = angBulan.reduce((sum, a) => sum + a.denda, 0)

        return {
          bulan: ym,
          labelBulan: monthLabel(ym),
          totalSetor,
          totalTarik,
          netSimpanan: totalSetor - totalTarik,
          totalAngsuranDiterima: totalAngsuran,
          totalDenda,
          txSimpanan: smpBulan.length,
          txAngsuran: angBulan.length,
        }
      })

      setRekapList(rekap)
      setLastUpdated(new Date())
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  // ── Load detail bulan dipilih ────────────────────────────────────────────
  const loadDetailBulan = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const [y, m] = bulanDipilih.split('-')
      const startDate = `${y}-${m}-01`
      const lastDay = new Date(+y, +m, 0).getDate()
      const endDate = `${y}-${m}-${lastDay}`

      const [smpRes, angRes] = await Promise.all([
        api.get<{ data: SimpananTx[] }>(`/simpanan?start_date=${startDate}&end_date=${endDate}&limit=200`),
        api.get<{ data: AngsuranTx[] }>(`/angsuran?limit=200`),
      ])

      const smpData: SimpananTx[] = smpRes.data ?? []
      const angData: AngsuranTx[] = (angRes.data ?? []).filter(
        (a: AngsuranTx) => a.tanggal_bayar?.startsWith(bulanDipilih)
      )

      // Enrich angsuran dengan nama_anggota dari pinjaman
      try {
        const pRes = await api.get<{ data: any[] }>('/pinjaman?limit=200')
        const pMap: Record<number, string> = {}
        ;(pRes.data ?? []).forEach((p: any) => { pMap[p.id_pinjaman] = p.nama_anggota ?? '—' })
        angData.forEach(a => { a.nama_anggota = pMap[a.id_pinjaman] ?? '—' })
      } catch { /* */ }

      setSimpananBulan(smpData)
      setAngsuranBulan(angData)
    } catch { /* */ }
    finally { setLoadingDetail(false) }
  }, [bulanDipilih])

  // ── Load pinjaman aktif ──────────────────────────────────────────────────
  const loadPinjaman = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = filterStatusPinjaman ? `&status=${filterStatusPinjaman}` : ''
      const res = await api.get<{ data: PinjamanItem[] }>(`/pinjaman?limit=200${statusParam}`)
      setPinjamanList(res.data ?? [])
    } catch { /* */ }
    finally { setLoading(false) }
  }, [filterStatusPinjaman])

  useEffect(() => { loadRekap(); loadDetailBulan() }, [loadRekap, loadDetailBulan])
  useEffect(() => { if (tab === 'pinjaman') loadPinjaman() }, [tab, loadPinjaman])

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedRekap = rekapList.find(r => r.bulan === bulanDipilih)
  const maxSetor = Math.max(...rekapList.map(r => r.totalSetor), 1)
  const maxAngsuran = Math.max(...rekapList.map(r => r.totalAngsuranDiterima), 1)

  const filteredPinjaman = pinjamanList.filter(p =>
    !searchPinjaman ||
    p.nama_anggota?.toLowerCase().includes(searchPinjaman.toLowerCase()) ||
    p.no_pinjaman.toLowerCase().includes(searchPinjaman.toLowerCase())
  )

  const totalSisaPinjaman = filteredPinjaman.reduce((sum, p) => sum + p.sisa_pinjaman, 0)
  const totalNominalPinjaman = filteredPinjaman.reduce((sum, p) => sum + p.nominal_pinjaman, 0)

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Laporan Keuangan Koperasi</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; }
        h1 { font-size: 18px; font-weight: bold; }
        h2 { font-size: 14px; font-weight: bold; margin: 20px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #e5e7eb; }
        td { padding: 7px 8px; border: 1px solid #e5e7eb; font-size: 11px; }
        tr:nth-child(even) { background: #fafafa; }
        .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
        .meta { color: #6b7280; font-size: 11px; margin-top: 4px; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
      <div class="header">
        <h1>LAPORAN KEUANGAN KOPERASI SIJAM</h1>
        <p class="meta">Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      ${el.innerHTML}
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 400)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink-800">Laporan Keuangan</h1>
          <p className="text-xs text-ink-300 mt-0.5">
            {lastUpdated ? `Update: ${lastUpdated.toLocaleTimeString('id-ID')}` : 'Memuat data...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadRekap(); loadDetailBulan(); if (tab === 'pinjaman') loadPinjaman() }}
            className="p-2.5 border border-surface-300 rounded-xl hover:bg-surface-100 transition-colors">
            <RefreshCw className={`w-4 h-4 text-ink-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-colors">
            <Printer className="w-4 h-4" />Cetak Laporan
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {[
          { key: 'rekap', label: 'Rekap Bulanan', icon: BarChart3 },
          { key: 'pinjaman', label: 'Sisa Pinjaman', icon: CreditCard },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-ink-800 shadow-sm'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ════ TAB: REKAP BULANAN ════ */}
      {tab === 'rekap' && (
        <div className="space-y-5">

          {/* Pilih Bulan + Summary Cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-ink-400" />
              <select
                value={bulanDipilih}
                onChange={e => setBulanDipilih(e.target.value)}
                className="px-3 py-2 rounded-xl border border-surface-300 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
              >
                {getMonthsBack(12).reverse().map(ym => (
                  <option key={ym} value={ym}>{monthLabel(ym)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary cards bulan dipilih */}
          {selectedRekap && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <LaporanCard
                label="Total Setor Simpanan"
                value={fmtCompact(selectedRekap.totalSetor)}
                sub={`${selectedRekap.txSimpanan} transaksi`}
                icon={ArrowDownCircle} color="text-emerald-600" bg="bg-emerald-50" trend="up"
              />
              <LaporanCard
                label="Total Tarik Simpanan"
                value={fmtCompact(selectedRekap.totalTarik)}
                sub={`Net: ${fmtCompact(selectedRekap.netSimpanan)}`}
                icon={ArrowUpCircle} color="text-red-500" bg="bg-red-50"
                trend={selectedRekap.netSimpanan >= 0 ? 'up' : 'down'}
              />
              <LaporanCard
                label="Angsuran Diterima"
                value={fmtCompact(selectedRekap.totalAngsuranDiterima)}
                sub={`${selectedRekap.txAngsuran} pembayaran`}
                icon={BadgeCheck} color="text-blue-600" bg="bg-blue-50" trend="up"
              />
              <LaporanCard
                label="Pemasukan Denda"
                value={fmtCompact(selectedRekap.totalDenda)}
                sub={selectedRekap.totalDenda > 0 ? 'Ada keterlambatan' : 'Tidak ada denda'}
                icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50"
              />
            </div>
          )}

          {/* Tabel Rekap 6 Bulan */}
          <div className="card">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent-600" />Rekap 6 Bulan Terakhir
            </h2>
            {loading ? (
              <div className="space-y-3">
                {Array(6).fill(0).map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200">
                      {['Bulan', 'Total Setor', 'Total Tarik', 'Net Simpanan', 'Angsuran Diterima', 'Denda', 'Trend Setor'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider py-3 pr-5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {rekapList.map(r => (
                      <tr
                        key={r.bulan}
                        onClick={() => setBulanDipilih(r.bulan)}
                        className={`hover:bg-surface-50 cursor-pointer transition-colors ${r.bulan === bulanDipilih ? 'bg-accent-500/5' : ''}`}
                      >
                        <td className="py-3 pr-5 font-medium text-ink-700 whitespace-nowrap">
                          {r.bulan === bulanDipilih && <span className="inline-block w-1.5 h-1.5 bg-accent-500 rounded-full mr-1.5 mb-0.5" />}
                          {r.labelBulan}
                        </td>
                        <td className="py-3 pr-5 text-emerald-700 font-semibold whitespace-nowrap">{r.totalSetor > 0 ? fmtCompact(r.totalSetor) : '—'}</td>
                        <td className="py-3 pr-5 text-red-500 font-semibold whitespace-nowrap">{r.totalTarik > 0 ? fmtCompact(r.totalTarik) : '—'}</td>
                        <td className={`py-3 pr-5 font-bold whitespace-nowrap ${r.netSimpanan >= 0 ? 'text-ink-800' : 'text-red-600'}`}>
                          {fmtCompact(r.netSimpanan)}
                        </td>
                        <td className="py-3 pr-5 text-blue-700 font-semibold whitespace-nowrap">{r.totalAngsuranDiterima > 0 ? fmtCompact(r.totalAngsuranDiterima) : '—'}</td>
                        <td className={`py-3 pr-5 font-semibold whitespace-nowrap ${r.totalDenda > 0 ? 'text-amber-600' : 'text-ink-300'}`}>
                          {r.totalDenda > 0 ? fmtCompact(r.totalDenda) : '—'}
                        </td>
                        <td className="py-3 pr-5 w-32">
                          <MiniBar value={r.totalSetor} max={maxSetor} color="bg-emerald-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Print-able content */}
          <div ref={printRef} style={{ display: 'none' }}>
            <h2>Rekap Simpanan 6 Bulan Terakhir</h2>
            <table>
              <thead><tr>
                <th>Bulan</th><th>Total Setor</th><th>Total Tarik</th>
                <th>Net Simpanan</th><th>Angsuran Diterima</th><th>Denda</th>
              </tr></thead>
              <tbody>
                {rekapList.map(r => (
                  <tr key={r.bulan}>
                    <td>{r.labelBulan}</td>
                    <td className="text-right">{fmt(r.totalSetor)}</td>
                    <td className="text-right">{fmt(r.totalTarik)}</td>
                    <td className={`text-right bold ${r.netSimpanan < 0 ? 'text-red' : 'text-green'}`}>{fmt(r.netSimpanan)}</td>
                    <td className="text-right">{fmt(r.totalAngsuranDiterima)}</td>
                    <td className="text-right">{r.totalDenda > 0 ? fmt(r.totalDenda) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail transaksi bulan dipilih */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Simpanan */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
                Transaksi Simpanan — {selectedRekap?.labelBulan ?? monthLabel(bulanDipilih)}
              </h3>
              {loadingDetail ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-surface-100 rounded-xl animate-pulse" />)}</div>
              ) : simpananBulan.length === 0 ? (
                <p className="text-xs text-ink-300 text-center py-6">Tidak ada transaksi simpanan</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {simpananBulan.map(s => (
                    <div key={s.id_simpanan} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.tipe_transaksi === 'setor' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {s.tipe_transaksi === 'setor'
                          ? <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <ArrowUpCircle   className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-ink-700 truncate">{s.nama_anggota ?? s.no_transaksi}</p>
                        <p className="text-[10px] text-ink-300">{s.tanggal_transaksi} · {s.nama_jenis_simpanan ?? '—'}</p>
                      </div>
                      <p className={`text-xs font-bold shrink-0 ${s.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {s.tipe_transaksi === 'tarik' ? '−' : '+'}{fmtCompact(s.nominal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Angsuran diterima */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-600" />
                Angsuran Diterima — {selectedRekap?.labelBulan ?? monthLabel(bulanDipilih)}
              </h3>
              {loadingDetail ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-surface-100 rounded-xl animate-pulse" />)}</div>
              ) : angsuranBulan.length === 0 ? (
                <p className="text-xs text-ink-300 text-center py-6">Tidak ada angsuran diterima</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {angsuranBulan.map(a => (
                    <div key={a.id_angsuran} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.denda > 0 ? 'bg-amber-50' : 'bg-blue-50'}`}>
                        {a.denda > 0
                          ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          : <BadgeCheck    className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-ink-700 truncate">{a.nama_anggota ?? a.no_pinjaman}</p>
                        <p className="text-[10px] text-ink-300">{a.tanggal_bayar} · Ke-{a.angsuran_ke} · {a.no_pinjaman}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-blue-700">{fmtCompact(a.total_bayar)}</p>
                        {a.denda > 0 && <p className="text-[10px] text-amber-600">+{fmtCompact(a.denda)} denda</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: SISA PINJAMAN ════ */}
      {tab === 'pinjaman' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <LaporanCard
              label="Total Pinjaman"
              value={fmtCompact(totalNominalPinjaman)}
              sub={`${filteredPinjaman.length} pinjaman`}
              icon={CreditCard} color="text-violet-600" bg="bg-violet-50"
            />
            <LaporanCard
              label="Total Sisa Pinjaman"
              value={fmtCompact(totalSisaPinjaman)}
              sub="Belum dilunasi"
              icon={Wallet} color="text-red-500" bg="bg-red-50" trend="down"
            />
            <LaporanCard
              label="Sudah Dilunasi"
              value={fmtCompact(totalNominalPinjaman - totalSisaPinjaman)}
              sub={`${Math.round(((totalNominalPinjaman - totalSisaPinjaman) / Math.max(totalNominalPinjaman, 1)) * 100)}% dari total`}
              icon={BadgeCheck} color="text-emerald-600" bg="bg-emerald-50" trend="up"
            />
          </div>

          {/* Filter & Search */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input
                  type="text"
                  placeholder="Cari nama anggota atau no. pinjaman..."
                  value={searchPinjaman}
                  onChange={e => setSearchPinjaman(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                />
              </div>
              <select
                value={filterStatusPinjaman}
                onChange={e => setFilterStatusPinjaman(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/30 shrink-0"
              >
                <option value="">Semua Status</option>
                <option value="disetujui">Aktif (Disetujui)</option>
                <option value="lunas">Lunas</option>
                <option value="menunggu">Menunggu</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200">
                      {['No. Pinjaman', 'Anggota', 'Nominal Pinjaman', 'Sisa Pinjaman', '% Lunas', 'Angsuran/Bulan', 'Status'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider py-3 pr-5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {filteredPinjaman.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center text-xs text-ink-300">Tidak ada data pinjaman</td></tr>
                    ) : filteredPinjaman.map(p => {
                      const sudahLunas  = p.nominal_pinjaman - p.sisa_pinjaman
                      const pctLunas    = Math.min(100, Math.round((sudahLunas / Math.max(p.nominal_pinjaman, 1)) * 100))
                      const STATUS_CLS: Record<string, string> = {
                        disetujui: 'bg-blue-50 text-blue-700',
                        lunas:     'bg-emerald-50 text-emerald-700',
                        menunggu:  'bg-amber-50 text-amber-700',
                        ditolak:   'bg-red-50 text-red-600',
                        pending:   'bg-amber-50 text-amber-700',
                      }
                      return (
                        <tr key={p.id_pinjaman} className="hover:bg-surface-50 transition-colors">
                          <td className="py-3 pr-5 font-mono text-[10px] text-ink-500 whitespace-nowrap">{p.no_pinjaman}</td>
                          <td className="py-3 pr-5 font-medium text-ink-700 whitespace-nowrap max-w-[140px] truncate">{p.nama_anggota ?? '—'}</td>
                          <td className="py-3 pr-5 font-semibold text-ink-800 whitespace-nowrap">{fmt(p.nominal_pinjaman)}</td>
                          <td className={`py-3 pr-5 font-bold whitespace-nowrap ${p.sisa_pinjaman > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {p.sisa_pinjaman > 0 ? fmt(p.sisa_pinjaman) : 'LUNAS'}
                          </td>
                          <td className="py-3 pr-5 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pctLunas}%` }} />
                              </div>
                              <span className="text-[10px] font-semibold text-ink-600 shrink-0">{pctLunas}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-5 text-ink-600 whitespace-nowrap">{fmt(p.nominal_angsuran)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CLS[p.status] ?? 'bg-surface-100 text-ink-500'}`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {filteredPinjaman.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-surface-200">
                        <td colSpan={2} className="py-3 pr-5 font-bold text-ink-800">TOTAL</td>
                        <td className="py-3 pr-5 font-bold text-ink-800">{fmt(totalNominalPinjaman)}</td>
                        <td className="py-3 pr-5 font-bold text-red-600">{fmt(totalSisaPinjaman)}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}