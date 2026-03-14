'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, CreditCard, Clock, AlertTriangle, CheckCircle2, XCircle,
  Calendar, ChevronLeft, ChevronRight, Printer, Download, X,
  BadgeCheck, Banknote, ReceiptText, FileText, Filter, RefreshCw,
  ArrowUpRight, Info, CalendarDays,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'

// ─── Types ──────────────────────────────────────────────────────────────────
interface AngsuranItem {
  id_angsuran: number
  id_pinjaman: number
  no_pinjaman: string
  no_angsuran: string
  angsuran_ke: number
  tanggal_jatuh_tempo: string
  nominal_angsuran: number
  pokok: number
  bunga: number
  denda: number
  total_bayar: number
  tanggal_bayar?: string
  status: 'belum_bayar' | 'lunas' | 'terlambat'
  keterangan?: string
  created_at: string
  // enriched client-side
  nama_anggota?: string
  no_anggota?: string
}

interface BuktiData {
  angsuran: AngsuranItem
  nama_anggota: string
  no_anggota: string
  nominal_angsuran: number
  denda: number
  total_bayar: number
  tanggal_bayar: string
  hari_terlambat: number
  keterangan?: string
  no_pinjaman: string
  angsuran_ke: number
  lama_angsuran?: number
  printed_at: string
}

interface PaginatedMeta { total: number; page: number; total_pages: number }

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const today = () => new Date().toISOString().split('T')[0]

// Dapatkan YYYY-MM bulan saat ini
const currentYM = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Konversi YYYY-MM → start & end date string
const ymToRange = (ym: string) => {
  const [y, m] = ym.split('-')
  const lastDay = new Date(+y, +m, 0).getDate()
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${lastDay}`,
  }
}

// Label bulan dalam bahasa Indonesia
const BULAN_LABEL: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember',
}

const ymLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${BULAN_LABEL[m] ?? m} ${y}`
}

const hitungDenda = (tanggal_jatuh_tempo: string, tanggal_bayar: string, nominal: number) => {
  const jt = new Date(tanggal_jatuh_tempo)
  const bayar = new Date(tanggal_bayar)
  if (bayar <= jt) return { denda: 0, hari: 0 }
  const hari = Math.ceil((bayar.getTime() - jt.getTime()) / (1000 * 60 * 60 * 24))
  const denda = nominal * (0.005 * hari)   // 0,5% per hari
  return { denda: Math.round(denda), hari }
}

// Generate daftar tahun (5 tahun ke belakang sampai sekarang)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => String(currentYear - i))
}

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  belum_bayar: { label: 'Belum Bayar', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: Clock },
  terlambat:   { label: 'Terlambat',   cls: 'bg-red-50 text-red-600 ring-1 ring-red-200',       icon: AlertTriangle },
  lunas:       { label: 'Lunas',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 },
}

function Badge({ status }: { status: AngsuranItem['status'] }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.belum_bayar
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
      <Icon className="w-3 h-3" />{s.label}
    </span>
  )
}

// ─── Modal Bayar ─────────────────────────────────────────────────────────────
function ModalBayar({
  angsuran,
  onClose,
  onSuccess,
}: {
  angsuran: AngsuranItem
  onClose: () => void
  onSuccess: (bukti: BuktiData) => void
}) {
  const [tanggalBayar, setTanggalBayar] = useState(today())
  const [keterangan, setKeterangan]     = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const { denda, hari } = hitungDenda(angsuran.tanggal_jatuh_tempo, tanggalBayar, angsuran.nominal_angsuran)
  const totalTagihan = angsuran.nominal_angsuran + denda
  const terlambat = hari > 0

  const handleBayar = async () => {
    setError('')
    setLoading(true)
    try {
      const payload = {
        tanggal_bayar: tanggalBayar,
        total_bayar: totalTagihan,
        keterangan: keterangan || undefined,
      }
      await api.post(`/angsuran/${angsuran.id_angsuran}/bayar`, payload)

      const bukti: BuktiData = {
        angsuran,
        nama_anggota: angsuran.nama_anggota ?? '—',
        no_anggota:   angsuran.no_anggota ?? '—',
        nominal_angsuran: angsuran.nominal_angsuran,
        denda,
        total_bayar: totalTagihan,
        tanggal_bayar: tanggalBayar,
        hari_terlambat: hari,
        keterangan: keterangan || undefined,
        no_pinjaman:  angsuran.no_pinjaman,
        angsuran_ke:  angsuran.angsuran_ke,
        printed_at:   new Date().toLocaleString('id-ID'),
      }
      onSuccess(bukti)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Gagal memproses pembayaran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Input Pembayaran Angsuran</h2>
              <p className="text-[10px] text-ink-300">{angsuran.no_angsuran} · Ke-{angsuran.angsuran_ke}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors ">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Info Angsuran */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-[10px] text-ink-300 font-medium uppercase tracking-wide">No. Pinjaman</p>
              <p className="text-xs font-semibold text-ink-800 mt-0.5 font-mono">{angsuran.no_pinjaman}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-[10px] text-ink-300 font-medium uppercase tracking-wide">Anggota</p>
              <p className="text-xs font-semibold text-ink-800 mt-0.5 truncate">{angsuran.nama_anggota ?? '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-[10px] text-ink-300 font-medium uppercase tracking-wide">Angsuran Ke</p>
              <p className="text-xs font-semibold text-ink-800 mt-0.5">{angsuran.angsuran_ke}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-[10px] text-ink-300 font-medium uppercase tracking-wide">Jatuh Tempo</p>
              <p className="text-xs font-semibold text-ink-800 mt-0.5">{fmtDate(angsuran.tanggal_jatuh_tempo)}</p>
            </div>
          </div>

          {/* Tanggal Bayar */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Tanggal Pembayaran</label>
            <input
              type="date"
              value={tanggalBayar}
              onChange={e => setTanggalBayar(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            />
          </div>

          {/* Ringkasan Tagihan */}
          <div className={`rounded-xl p-4 border ${terlambat ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-xs font-semibold mb-3 ${terlambat ? 'text-red-700' : 'text-emerald-700'}`}>
              {terlambat ? `⚠ Terlambat ${hari} hari — denda berlaku` : '✓ Pembayaran tepat waktu'}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Nominal Angsuran</span>
                <span className="font-medium">{fmt(angsuran.nominal_angsuran)}</span>
              </div>
              {terlambat && (
                <div className="flex justify-between text-red-600">
                  <span>Denda ({hari} hari × 0,5%)</span>
                  <span className="font-medium">{fmt(denda)}</span>
                </div>
              )}
              <div className={`flex justify-between font-bold text-sm pt-1.5 border-t ${terlambat ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}>
                <span>Total Tagihan</span>
                <span>{fmt(totalTagihan)}</span>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Keterangan (opsional)</label>
            <input
              type="text"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Misal: Transfer BCA"
              className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <XCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 border border-surface-300 hover:bg-surface-100 transition-colors">
            Batal
          </button>
          <button
            onClick={handleBayar}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bukti Pembayaran ────────────────────────────────────────────────────────
function BuktiPembayaran({ bukti, onClose }: { bukti: BuktiData; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Bukti Pembayaran Angsuran</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 380px; margin: 0 auto; padding: 16px; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        .total { font-size: 14px; font-weight: bold; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-600" />
            <h2 className="text-sm font-semibold text-ink-800">Bukti Pembayaran</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Receipt content */}
        <div className="px-6 py-5">
          <div ref={printRef} className="font-mono text-[11px] text-ink-700">
            <p className="text-center font-bold text-sm mb-1">KOPERASI</p>
            <p className="text-center text-[10px] text-ink-400 mb-3">Bukti Pembayaran Angsuran</p>
            <div className="border-t border-dashed border-surface-300 my-2" />
            {[
              ['No. Angsuran', bukti.angsuran.no_angsuran],
              ['No. Pinjaman', bukti.no_pinjaman],
              ['Anggota', bukti.nama_anggota],
              ['No. Anggota', bukti.no_anggota],
              ['Angsuran Ke', String(bukti.angsuran_ke)],
              ['Tgl Jatuh Tempo', fmtDate(bukti.angsuran.tanggal_jatuh_tempo)],
              ['Tgl Bayar', fmtDate(bukti.tanggal_bayar)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5">
                <span className="text-ink-400">{k}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-surface-300 my-2" />
            <div className="flex justify-between py-0.5">
              <span className="text-ink-400">Nominal</span>
              <span>{fmt(bukti.nominal_angsuran)}</span>
            </div>
            {bukti.denda > 0 && (
              <div className="flex justify-between py-0.5 text-red-600">
                <span>Denda</span>
                <span>{fmt(bukti.denda)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-surface-300 my-2" />
            <div className="flex justify-between py-1 font-bold text-sm">
              <span>TOTAL BAYAR</span>
              <span>{fmt(bukti.total_bayar)}</span>
            </div>
            <div className="border-t border-dashed border-surface-300 my-2" />
            <div className={`text-center py-1.5 rounded text-[10px] font-bold mt-2 ${
              bukti.hari_terlambat > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {bukti.hari_terlambat > 0
                ? `⚠ TERLAMBAT ${bukti.hari_terlambat} HARI`
                : '✓ LUNAS — TEPAT WAKTU'}
            </div>
            <p className="text-center text-ink-300 text-[10px] mt-3">Dicetak oleh sistem koperasi</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 border border-surface-300 hover:bg-surface-100 transition-colors">
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-colors"
          >
            <Printer className="w-4 h-4" />Cetak Bukti
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AngsuranPage() {
  const { user } = useAuth()
  const isBendahara = user?.role === 'bendahara' || user?.role === 'admin'

  // ── Filter Bulan & Tahun ─────────────────────────────────────────────────
  const nowYM = currentYM()
  const [filterBulan, setFilterBulan]   = useState(nowYM.split('-')[1])   // '03'
  const [filterTahun, setFilterTahun]   = useState(nowYM.split('-')[0])   // '2025'
  const [hasSearched, setHasSearched]   = useState(false)   // DATA HANYA TAMPIL SETELAH FILTER DITERAPKAN

  const [list, setList]             = useState<AngsuranItem[]>([])
  const [meta, setMeta]             = useState<PaginatedMeta>({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState<string>('')
  const [page, setPage]             = useState(1)
  const LIMIT = 10

  const [selected, setSelected]     = useState<AngsuranItem | null>(null)
  const [bukti, setBukti]           = useState<BuktiData | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    if (!hasSearched) return   // ← Jangan load sebelum filter diterapkan

    setLoading(true)
    try {
      const ym = `${filterTahun}-${filterBulan}`
      const { start, end } = ymToRange(ym)

      const skip = (page - 1) * LIMIT
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(LIMIT),
        start_date: start,
        end_date: end,
      })
      if (filterStatus) params.set('status', filterStatus)

      const res = await api.get<{ data: AngsuranItem[]; meta: PaginatedMeta }>(
        `/angsuran?${params.toString()}`
      )
      const rows: AngsuranItem[] = res.data ?? []

      // Enrich: ambil nama anggota dari pinjaman
      const pinjamanIds = [...new Set(rows.map(r => r.id_pinjaman))]
      if (pinjamanIds.length > 0) {
        try {
          const pRes = await api.get<{ data: { id_pinjaman: number; nama_anggota?: string; no_pinjaman: string; id_anggota: number }[]; meta: PaginatedMeta }>(
            `/pinjaman?limit=100`
          )
          const pMap: Record<number, { nama?: string; no?: string }> = {}
          ;(pRes.data ?? []).forEach((p: any) => {
            pMap[p.id_pinjaman] = { nama: p.nama_anggota, no: p.no_anggota }
          })
          rows.forEach(r => {
            r.nama_anggota = pMap[r.id_pinjaman]?.nama ?? '—'
            r.no_anggota   = pMap[r.id_pinjaman]?.no ?? '—'
          })
        } catch { /* nama tetap undefined */ }
      }

      setList(rows)
      setMeta(res.meta ?? { total: 0, page, total_pages: 1 })
    } catch { /* */ }
    finally { setLoading(false) }
  }, [page, filterStatus, filterBulan, filterTahun, hasSearched])

  useEffect(() => { load() }, [load])

  // Reset halaman & load ulang ketika filter status berubah
  const handleFilterStatus = (s: string) => {
    setFilter(filterStatus === s ? '' : s)
    setPage(1)
  }

  // Terapkan filter bulan/tahun
  const handleTerapkan = () => {
    setPage(1)
    setHasSearched(true)
  }

  // Client-side search filter
  const filtered = list.filter(a =>
    !search ||
    a.no_angsuran.toLowerCase().includes(search.toLowerCase()) ||
    a.no_pinjaman.toLowerCase().includes(search.toLowerCase()) ||
    (a.nama_anggota ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleBayarSuccess = (b: BuktiData) => {
    setSelected(null)
    setBukti(b)
    showToast('Pembayaran berhasil dicatat')
    load()
  }

  // Summary counts dari data yang sudah di-load
  const belumBayar = list.filter(a => a.status === 'belum_bayar').length
  const terlambat  = list.filter(a => a.status === 'terlambat').length
  const lunas      = list.filter(a => a.status === 'lunas').length

  const labelBulanTerpilih = ymLabel(`${filterTahun}-${filterBulan}`)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          <BadgeCheck className="w-4 h-4" />{toast}
        </div>
      )}

      {/* ── Filter Bulan & Tahun ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-800">Filter Periode Angsuran</h2>
            <p className="text-[11px] text-ink-400">Pilih bulan dan tahun untuk menampilkan data angsuran</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Bulan */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5 uppercase tracking-wide">Bulan</label>
            <select
              value={filterBulan}
              onChange={e => setFilterBulan(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            >
              {Object.entries(BULAN_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="flex-1 min-w-[100px]">
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5 uppercase tracking-wide">Tahun</label>
            <select
              value={filterTahun}
              onChange={e => setFilterTahun(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            >
              {getYearOptions().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Tombol Tampilkan */}
          <button
            onClick={handleTerapkan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-colors shrink-0"
          >
            <Filter className="w-4 h-4" />
            Tampilkan
          </button>
        </div>
      </div>

      {/* ── Sebelum filter diterapkan: tampilkan placeholder ─────────────── */}
      {!hasSearched && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-ink-300" />
          </div>
          <p className="text-sm font-semibold text-ink-600 mb-1">Pilih Periode Terlebih Dahulu</p>
          <p className="text-xs text-ink-400 max-w-xs">
            Pilih bulan dan tahun di atas, lalu klik <span className="font-medium text-accent-600">Tampilkan</span> untuk melihat data angsuran pada periode tersebut.
          </p>
        </div>
      )}

      {/* ── Setelah filter diterapkan ─────────────────────────────────────── */}
      {hasSearched && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Belum Bayar', count: loading ? '...' : belumBayar, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', filter: 'belum_bayar' },
              { label: 'Terlambat',   count: loading ? '...' : terlambat,  icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500', filter: 'terlambat' },
              { label: 'Lunas',       count: loading ? '...' : lunas,      icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600', filter: 'lunas' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => handleFilterStatus(s.filter)}
                className={`rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${
                  filterStatus === s.filter
                    ? 'border-accent-500 ring-1 ring-accent-500/30'
                    : 'border-surface-200 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-ink-800">{s.count}</p>
                <p className="text-xs text-ink-400 mt-0.5">{s.label} · {labelBulanTerpilih}</p>
              </button>
            ))}
          </div>

          {/* Tabel Data */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm">
            {/* Header Tabel */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-800">Data Angsuran</h2>
                  <p className="text-[11px] text-ink-400">{labelBulanTerpilih} · {meta.total} angsuran</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari anggota / no. angsuran…"
                    className="pl-9 pr-4 py-2 rounded-xl border border-surface-300 text-xs text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 w-52"
                  />
                </div>
                {/* Refresh */}
                <button
                  onClick={load}
                  disabled={loading}
                  className="p-2 rounded-xl border border-surface-300 text-ink-500 hover:bg-surface-100 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
                  <p className="text-xs text-ink-400">Memuat data angsuran {labelBulanTerpilih}…</p>
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
                  <CreditCard className="w-6 h-6 text-ink-300" />
                </div>
                <p className="text-sm font-medium text-ink-500">Tidak ada data angsuran</p>
                <p className="text-xs text-ink-400 mt-1">pada periode {labelBulanTerpilih}</p>
              </div>
            )}

            {/* Table */}
            {!loading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-100">
                      {['No. Angsuran', 'Anggota', 'Jatuh Tempo', 'Nominal', 'Denda', 'Total', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {filtered.map(a => (
                      <tr key={a.id_angsuran} className="hover:bg-surface-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-mono font-semibold text-ink-700">{a.no_angsuran}</p>
                          <p className="text-ink-400 text-[10px]">Ke-{a.angsuran_ke}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-ink-700">{a.nama_anggota ?? '—'}</p>
                          <p className="text-ink-400 text-[10px]">{a.no_pinjaman}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                          {fmtDate(a.tanggal_jatuh_tempo)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-ink-700">
                          {fmt(a.nominal_angsuran)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={a.denda > 0 ? 'text-red-600 font-semibold' : 'text-ink-300'}>
                            {a.denda > 0 ? fmt(a.denda) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-ink-800">
                          {a.total_bayar > 0 ? fmt(a.total_bayar) : fmt(a.nominal_angsuran)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge status={a.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {/* Bayar — hanya untuk belum_bayar / terlambat */}
                            {isBendahara && a.status !== 'lunas' && (
                              <button
                                onClick={() => setSelected(a)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-600 text-white text-[10px] font-medium hover:bg-accent-700 transition-colors whitespace-nowrap"
                              >
                                <Banknote className="w-3 h-3" />Bayar
                              </button>
                            )}
                            {/* Cetak bukti — hanya untuk yang sudah lunas */}
                            {a.status === 'lunas' && (
                              <button
                                onClick={() => {
                                  const denda = a.denda ?? 0
                                  setBukti({
                                    angsuran: a,
                                    nama_anggota: a.nama_anggota ?? '—',
                                    no_anggota: a.no_anggota ?? '—',
                                    nominal_angsuran: a.nominal_angsuran,
                                    denda,
                                    total_bayar: a.total_bayar,
                                    tanggal_bayar: a.tanggal_bayar ?? '',
                                    hari_terlambat: a.denda > 0
                                      ? Math.round(a.denda / (a.nominal_angsuran * 0.005))
                                      : 0,
                                    keterangan: a.keterangan,
                                    no_pinjaman: a.no_pinjaman,
                                    angsuran_ke: a.angsuran_ke,
                                    printed_at: new Date().toLocaleString('id-ID'),
                                  })
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-surface-300 text-ink-500 text-[10px] font-medium hover:bg-surface-100 transition-colors whitespace-nowrap"
                              >
                                <ReceiptText className="w-3 h-3" />Bukti
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && meta.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 mt-5 pb-5 pt-3 border-t border-surface-100">
                <p className="text-xs text-ink-300">
                  Total <span className="font-semibold text-ink-600">{meta.total}</span> angsuran
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-surface-300 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-ink-500" />
                  </button>
                  <span className="text-xs font-medium text-ink-700 px-2">
                    {page} / {meta.total_pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
                    disabled={page === meta.total_pages}
                    className="p-1.5 rounded-lg border border-surface-300 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-ink-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {selected && (
        <ModalBayar
          angsuran={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleBayarSuccess}
        />
      )}
      {bukti && <BuktiPembayaran bukti={bukti} onClose={() => setBukti(null)} />}
    </div>
  )
}