'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Search, Plus, RefreshCw, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle,
  CreditCard, Calculator, Trash2, CheckCheck
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface Anggota {
  id_anggota: number
  no_anggota: string
  nama_lengkap: string
  status: string
}

interface Pinjaman {
  id_pinjaman: number
  id_anggota: number
  nama_anggota?: string
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  bunga_persen: number
  total_bunga: number
  total_pinjaman: number
  lama_angsuran: number
  nominal_angsuran: number
  keperluan?: string
  status: 'menunggu' | 'pending' | 'disetujui' | 'ditolak' | 'lunas'
  sisa_pinjaman: number
  created_at: string
}

interface PaginatedResponse {
  data: Pinjaman[]
  meta: { total: number; page: number; total_pages: number; skip: number; limit: number }
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  menunggu:  { label: 'Menunggu',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock         },
  pending:   { label: 'Menunggu',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock         },
  disetujui: { label: 'Disetujui', color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle2  },
  ditolak:   { label: 'Ditolak',   color: 'text-red-500',     bg: 'bg-red-50',     icon: XCircle       },
  lunas:     { label: 'Lunas',     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCheck    },
}

const NOMINAL_SHORTCUTS = [1, 2, 5, 10, 15, 20, 25, 50]
const LAMA_OPTIONS = [3, 6, 9, 12, 18, 24, 36, 48]

// ============================================================================
// Helpers
// ============================================================================

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function parseRupiah(s: string) {
  return Number(s.replace(/\D/g, '')) || 0
}

// ============================================================================
// Avatar
// ============================================================================

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm'
    ? { wrap: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' }
    : { wrap: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' }
  return (
    <div className={cn('flex items-center justify-center shrink-0', cls.wrap)}
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
      <User className={cn(cls.icon, 'text-white')} />
    </div>
  )
}

// ============================================================================
// Modal Pengajuan Pinjaman
// ============================================================================

interface ModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

function ModalPengajuan({ open, onClose, onSaved }: ModalProps) {
  const [step, setStep] = useState<'form' | 'preview'>('form')

  // Anggota search
  const [anggotaSearch, setAnggotaSearch] = useState('')
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)
  const [loadingAnggota, setLoadingAnggota] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Form values
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [keperluan, setKeperluan] = useState('')
  const [nominal, setNominal] = useState(0)
  const [nominalInput, setNominalInput] = useState('')
  const [bunga, setBunga] = useState(2)
  const [lama, setLama] = useState(12)

  // Kalkulasi
  const totalBunga = nominal * (bunga / 100)
  const totalPinjaman = nominal + totalBunga
  const angsuranPerBulan = lama > 0 ? totalPinjaman / lama : 0

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset saat modal dibuka
  useEffect(() => {
    if (open) {
      setStep('form')
      setSelectedAnggota(null)
      setAnggotaSearch('')
      setAnggotaList([])
      setTanggal(new Date().toISOString().slice(0, 10))
      setKeperluan('')
      setNominal(0)
      setNominalInput('')
      setBunga(2)
      setLama(12)
      setError(null)
    }
  }, [open])

  // Search anggota
  useEffect(() => {
    if (!anggotaSearch.trim()) { setAnggotaList([]); return }
    const t = setTimeout(async () => {
      setLoadingAnggota(true)
      try {
        const res = await api.get<{ data: Anggota[] }>(`/anggota?search=${encodeURIComponent(anggotaSearch)}&limit=6&status=aktif`)
        setAnggotaList(res.data)
      } catch { setAnggotaList([]) }
      finally { setLoadingAnggota(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [anggotaSearch])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNominalInput = (val: string) => {
    const num = parseRupiah(val)
    setNominal(num)
    setNominalInput(num > 0 ? num.toLocaleString('id-ID') : '')
  }

  const handleShortcut = (jt: number) => {
    const num = jt * 1_000_000
    setNominal(num)
    setNominalInput(num.toLocaleString('id-ID'))
  }

  const handleSubmit = async () => {
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu.'); return }
    if (nominal < 1_000_000) { setError('Nominal pinjaman minimal Rp 1.000.000.'); return }
    if (!keperluan.trim()) { setError('Keperluan wajib diisi.'); return }
    setError(null)
    setLoading(true)
    try {
      await api.post('/pinjaman', {
        id_anggota: selectedAnggota.id_anggota,
        tanggal_pengajuan: tanggal,
        nominal_pinjaman: nominal,
        bunga_persen: bunga,
        lama_angsuran: lama,
        keperluan: keperluan.trim(),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengajukan pinjaman.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — max-h dan overflow-y-auto agar tidak terpotong */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">

        {/* ── Header (fixed) ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-ink-800">Pengajuan Pinjaman Baru</h2>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* ── SECTION: Data Anggota ── */}
          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Data Anggota</p>
            <div className="space-y-3">

              {/* Cari anggota */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Cari Anggota <span className="text-red-400">*</span>
                </label>
                <div ref={dropdownRef} className="relative">
                  {selectedAnggota ? (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[#2a7fc5] bg-blue-50">
                      <Avatar size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800">{selectedAnggota.nama_lengkap}</p>
                        <p className="text-xs text-ink-400">{selectedAnggota.no_anggota}</p>
                      </div>
                      <button onClick={() => { setSelectedAnggota(null); setAnggotaSearch('') }}
                        className="text-ink-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                        <input
                          value={anggotaSearch}
                          onChange={e => { setAnggotaSearch(e.target.value); setShowDropdown(true) }}
                          onFocus={() => anggotaSearch && setShowDropdown(true)}
                          placeholder="Ketik nama atau nomor anggota..."
                          className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200"
                        />
                      </div>
                      {showDropdown && (anggotaSearch || loadingAnggota) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-surface-300 shadow-lg z-20 overflow-hidden">
                          {loadingAnggota
                            ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-ink-300" /></div>
                            : anggotaList.length === 0
                            ? <p className="text-xs text-ink-300 text-center py-4">Anggota tidak ditemukan</p>
                            : anggotaList.map(a => (
                              <button key={a.id_anggota}
                                onClick={() => { setSelectedAnggota(a); setShowDropdown(false); setAnggotaSearch('') }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors text-left">
                                <Avatar size="sm" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-ink-800 truncate">{a.nama_lengkap}</p>
                                  <p className="text-xs text-ink-400">{a.no_anggota}</p>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Tanggal & Keperluan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tanggal Pengajuan</label>
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                    Keperluan <span className="text-red-400">*</span>
                  </label>
                  <input value={keperluan} onChange={e => setKeperluan(e.target.value)} placeholder="cth: Modal usaha" className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-surface-200" />

          {/* ── SECTION: Detail Pinjaman ── */}
          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Detail Pinjaman</p>
            <div className="space-y-4">

              {/* Nominal shortcut */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-2">
                  Nominal Pinjaman <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {NOMINAL_SHORTCUTS.map(jt => (
                    <button key={jt}
                      onClick={() => handleShortcut(jt)}
                      className={cn(
                        'h-7 px-2.5 rounded-lg text-xs font-semibold border transition-all',
                        nominal === jt * 1_000_000
                          ? 'bg-ink-800 text-white border-ink-800'
                          : 'bg-white border-surface-300 text-ink-600 hover:border-ink-300'
                      )}>
                      {jt} Jt
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-surface-300 bg-surface-50 focus-within:border-[#2a7fc5] focus-within:ring-2 focus-within:ring-[#2a7fc5]/20 focus-within:bg-white transition-all">
                  <span className="text-sm font-semibold text-ink-400 shrink-0">Rp</span>
                  <input
                    value={nominalInput}
                    onChange={e => handleNominalInput(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-sm text-ink-800 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Bunga & Lama */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">Bunga (%/bln)</label>
                  <input
                    type="number" min={0} max={10} step={0.5}
                    value={bunga}
                    onChange={e => setBunga(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1.5">Lama Angsuran</label>
                  <select value={lama} onChange={e => setLama(Number(e.target.value))} className={inputCls}>
                    {LAMA_OPTIONS.map(m => (
                      <option key={m} value={m}>{m} bulan</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kalkulasi preview */}
              {nominal > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Estimasi Pinjaman</p>
                  </div>
                  {[
                    { label: 'Pokok Pinjaman', value: formatRupiah(nominal) },
                    { label: `Bunga (${bunga}%/bln × ${lama} bln)`, value: formatRupiah(totalBunga) },
                    { label: 'Total Pinjaman', value: formatRupiah(totalPinjaman), bold: true },
                    { label: 'Angsuran/Bulan', value: formatRupiah(angsuranPerBulan), bold: true, highlight: true },
                  ].map(row => (
                    <div key={row.label} className={cn('flex justify-between items-center', row.bold && 'pt-2 border-t border-blue-200')}>
                      <span className="text-xs text-blue-600">{row.label}</span>
                      <span className={cn('text-sm font-bold', row.highlight ? 'text-blue-700' : 'text-blue-800')}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer (fixed) ── */}
        <div className="flex gap-2 px-6 py-4 border-t border-surface-200 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAnggota || nominal < 1_000_000}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Mengajukan...</> : 'Ajukan Pinjaman'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function PinjamanPage() {
  const [data, setData] = useState<Pinjaman[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [counts, setCounts] = useState({ semua: 0, pending: 0, disetujui: 0, ditolak: 0, lunas: 0 })

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * LIMIT),
        limit: String(LIMIT),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      const res = await api.get<PaginatedResponse>(`/pinjaman?${params}`)
      setData(res.data)
      setMeta({ total: res.meta.total, page: res.meta.page, total_pages: res.meta.total_pages })

      // Fetch counts
      try {
        const [all, pending, disetujui, ditolak, lunas] = await Promise.all([
          api.get<PaginatedResponse>('/pinjaman?limit=1'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=pending'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=disetujui'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=ditolak'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=lunas'),
        ])
        setCounts({
          semua: all.meta.total,
          pending: pending.meta.total,
          disetujui: disetujui.meta.total,
          ditolak: ditolak.meta.total,
          lunas: lunas.meta.total,
        })
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const STAT_CARDS = [
    { label: 'Total Pinjaman', count: counts.semua,     iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
    { label: 'Menunggu',       count: counts.pending,   iconBg: 'bg-amber-50',   iconColor: 'text-amber-500'   },
    { label: 'Disetujui',      count: counts.disetujui, iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
    { label: 'Lunas',          count: counts.lunas,     iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  ]

  const FILTER_PILLS = [
    { value: '',          label: 'Semua'     },
    { value: 'pending',   label: '● Menunggu'  },
    { value: 'disetujui', label: '● Disetujui' },
    { value: 'ditolak',   label: '● Ditolak'   },
    { value: 'lunas',     label: '● Lunas'     },
  ]

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-ink-800">Manajemen Pinjaman</h2>
          <p className="text-xs text-ink-300">Kelola seluruh data pinjaman koperasi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all"
            title="Refresh">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Pengajuan Baru
          </button>
        </div>
      </div>

      {/* ── Rekap Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-surface-300 shadow-card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
              <CreditCard className={cn('w-5 h-5', card.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800 leading-none">{card.count}</p>
              <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_PILLS.map(pill => (
          <button key={pill.value}
            onClick={() => { setStatusFilter(pill.value); setPage(1) }}
            className={cn(
              'h-8 px-3.5 rounded-full text-xs font-semibold transition-all border',
              statusFilter === pill.value
                ? 'bg-ink-800 text-white border-ink-800'
                : 'bg-white border-surface-300 text-ink-600 hover:border-ink-300 hover:bg-surface-50'
            )}>
            {pill.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {['NO. PINJAMAN', 'ANGGOTA', 'NOMINAL', 'SISA', 'ANGSURAN/BLN', 'TGL. PENGAJUAN', 'STATUS'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-ink-300 tracking-widest uppercase px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-300 mx-auto mb-2" />
                  <p className="text-xs text-ink-300">Memuat data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <CreditCard className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-300">Belum ada data pinjaman</p>
                </td>
              </tr>
            ) : (
              data.map((p, idx) => {
                const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.menunggu
                const StIcon = st.icon
                const persen = p.total_pinjaman > 0
                  ? Math.round(((p.total_pinjaman - p.sisa_pinjaman) / p.total_pinjaman) * 100)
                  : 0

                return (
                  <tr key={p.id_pinjaman}
                    className={cn('border-b border-surface-100 hover:bg-surface-50 transition-colors',
                      idx === data.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3 text-xs font-mono text-ink-400 whitespace-nowrap">{p.no_pinjaman}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-ink-800 whitespace-nowrap">{p.nama_anggota ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-800 whitespace-nowrap">{formatRupiah(p.nominal_pinjaman)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-ink-800">{formatRupiah(p.sisa_pinjaman)}</p>
                        {p.status === 'disetujui' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 h-1 bg-surface-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${persen}%` }} />
                            </div>
                            <span className="text-[10px] text-ink-300">{persen}%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatRupiah(p.nominal_angsuran)}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{p.tanggal_pengajuan}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', st.bg, st.color)}>
                        <StIcon className="w-3 h-3" />{st.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-300">Halaman {meta.page} dari {meta.total_pages} ({meta.total} total)</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.total_pages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <>
                  {i > 0 && arr[i - 1] !== p - 1 && <span key={`d${p}`} className="text-ink-300 text-xs px-1">…</span>}
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      p === page ? 'text-white shadow-sm' : 'border border-surface-300 text-ink-500 hover:bg-surface-100')}
                    style={p === page ? { background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' } : {}}>
                    {p}
                  </button>
                </>
              ))}
            <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      <ModalPengajuan open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchData} />
    </div>
  )
}