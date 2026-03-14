'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Search, Plus, RefreshCw, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  PiggyBank, TrendingUp, TrendingDown, Wallet, Info
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

interface JenisSimpanan {
  id_jenis_simpanan: number
  kode_jenis: string
  nama_jenis: string
  deskripsi?: string
  is_wajib: boolean
  nominal_tetap: number
  is_active: boolean
}

interface Simpanan {
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
  created_at: string
}

interface PaginatedResponse {
  data: Simpanan[]
  meta: { total: number; page: number; total_pages: number; skip: number; limit: number }
}

// ============================================================================
// Helpers
// ============================================================================

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

function parseAngka(s: string) {
  return Number(s.replace(/\D/g, '')) || 0
}

// ============================================================================
// Avatar siluet orang
// ============================================================================

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm'
    ? { wrap: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' }
    : { wrap: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' }
  return (
    <div
      className={cn('flex items-center justify-center shrink-0', cls.wrap)}
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
    >
      <User className={cn(cls.icon, 'text-white')} />
    </div>
  )
}

// ============================================================================
// Modal Transaksi Simpanan
// ============================================================================

interface ModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultTipe?: 'setor' | 'tarik'
}

function ModalTransaksi({ open, onClose, onSaved, defaultTipe = 'setor' }: ModalProps) {
  // Anggota
  const [anggotaSearch, setAnggotaSearch]   = useState('')
  const [anggotaList, setAnggotaList]       = useState<Anggota[]>([])
  const [showDropdown, setShowDropdown]     = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)
  const [loadingAnggota, setLoadingAnggota] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Jenis simpanan
  const [jenisList, setJenisList]       = useState<JenisSimpanan[]>([])
  const [selectedJenis, setSelectedJenis] = useState<JenisSimpanan | null>(null)

  // Form
  const [tipe, setTipe]             = useState<'setor' | 'tarik'>(defaultTipe)
  const [tanggal, setTanggal]       = useState(new Date().toISOString().slice(0, 10))
  const [nominal, setNominal]       = useState(0)
  const [nominalInput, setNominalInput] = useState('')
  const [nominalLocked, setNominalLocked] = useState(false) // true jika nominal_tetap > 0
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Saldo anggota untuk jenis terpilih
  const [saldoInfo, setSaldoInfo] = useState<{ saldo: number; nama_jenis: string } | null>(null)
  const [loadingSaldo, setLoadingSaldo] = useState(false)

  // Reset saat buka modal
  useEffect(() => {
    if (open) {
      setTipe(defaultTipe)
      setSelectedAnggota(null)
      setAnggotaSearch('')
      setAnggotaList([])
      setSelectedJenis(null)
      setTanggal(new Date().toISOString().slice(0, 10))
      setNominal(0)
      setNominalInput('')
      setNominalLocked(false)
      setKeterangan('')
      setError(null)
      setSaldoInfo(null)
    }
  }, [open, defaultTipe])

  // Fetch jenis simpanan aktif
  useEffect(() => {
    if (!open) return
    api.get<JenisSimpanan[]>('/simpanan/jenis?is_active=true')
      .then(setJenisList)
      .catch(() => setJenisList([]))
  }, [open])

  // Otomatis isi nominal dari nominal_tetap jenis simpanan
  useEffect(() => {
    if (!selectedJenis) return
    if (selectedJenis.nominal_tetap > 0) {
      setNominal(selectedJenis.nominal_tetap)
      setNominalInput(selectedJenis.nominal_tetap.toLocaleString('id-ID'))
      setNominalLocked(true)
    } else {
      setNominal(0)
      setNominalInput('')
      setNominalLocked(false)
    }
  }, [selectedJenis])

  // Fetch saldo anggota untuk jenis terpilih
  useEffect(() => {
    if (!selectedAnggota || !selectedJenis) { setSaldoInfo(null); return }
    setLoadingSaldo(true)
    api.get<{ saldo: number; nama_jenis_simpanan: string }[]>(
      `/simpanan/saldo/${selectedAnggota.id_anggota}`
    ).then(list => {
      const found = list.find(s => s.nama_jenis_simpanan === selectedJenis.nama_jenis)
      setSaldoInfo(found
        ? { saldo: found.saldo, nama_jenis: found.nama_jenis_simpanan }
        : { saldo: 0, nama_jenis: selectedJenis.nama_jenis })
    }).catch(() => setSaldoInfo(null))
    .finally(() => setLoadingSaldo(false))
  }, [selectedAnggota, selectedJenis])

  // Search anggota
  useEffect(() => {
    if (!anggotaSearch.trim()) { setAnggotaList([]); return }
    const t = setTimeout(async () => {
      setLoadingAnggota(true)
      try {
        const res = await api.get<{ data: Anggota[] }>(
          `/anggota?search=${encodeURIComponent(anggotaSearch)}&limit=6&status=aktif`
        )
        setAnggotaList(res.data)
      } catch { setAnggotaList([]) }
      finally { setLoadingAnggota(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [anggotaSearch])

  // Close dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleNominalInput = (val: string) => {
    if (nominalLocked) return
    const num = parseAngka(val)
    setNominal(num)
    setNominalInput(num > 0 ? num.toLocaleString('id-ID') : '')
  }

  const handleSubmit = async () => {
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu.'); return }
    if (!selectedJenis) { setError('Pilih jenis simpanan.'); return }
    if (nominal <= 0) { setError('Nominal harus lebih dari 0.'); return }
    setError(null)
    setLoading(true)
    try {
      const endpoint = tipe === 'setor' ? '/simpanan/setor' : '/simpanan/tarik'
      await api.post(endpoint, {
        id_anggota: selectedAnggota.id_anggota,
        id_jenis_simpanan: selectedJenis.id_jenis_simpanan,
        tanggal_transaksi: tanggal,
        tipe_transaksi: tipe,
        nominal,
        keterangan: keterangan.trim() || null,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
              tipe === 'setor' ? 'bg-emerald-50' : 'bg-red-50')}>
              {tipe === 'setor'
                ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                : <ArrowUpCircle className="w-4 h-4 text-red-400" />}
            </div>
            <h2 className="text-sm font-bold text-ink-800">Transaksi Simpanan</h2>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Tipe Transaksi toggle */}
          <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
            {(['setor', 'tarik'] as const).map(t => (
              <button key={t} onClick={() => setTipe(t)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-semibold transition-all',
                  tipe === t
                    ? t === 'setor'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-red-500 text-white shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                )}>
                {t === 'setor'
                  ? <><ArrowDownCircle className="w-3.5 h-3.5" />Setor</>
                  : <><ArrowUpCircle className="w-3.5 h-3.5" />Tarik</>}
              </button>
            ))}
          </div>

          {/* Section: Data Anggota */}
          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Data Anggota</p>
            <div ref={dropdownRef} className="relative">
              {selectedAnggota ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[#2a7fc5] bg-blue-50">
                  <Avatar size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800">{selectedAnggota.nama_lengkap}</p>
                    <p className="text-xs text-ink-400">{selectedAnggota.no_anggota}</p>
                  </div>
                  <button onClick={() => { setSelectedAnggota(null); setAnggotaSearch(''); setSaldoInfo(null) }}
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
                      placeholder="Cari nama atau nomor anggota..."
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

          {/* Divider */}
          <div className="border-t border-surface-200" />

          {/* Section: Detail Transaksi */}
          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Detail Transaksi</p>
            <div className="space-y-4">

              {/* Jenis Simpanan */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Jenis Simpanan <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {jenisList.length === 0 ? (
                    <p className="text-xs text-ink-300 py-2">Memuat jenis simpanan...</p>
                  ) : (
                    jenisList.map(j => (
                      <button
                        key={j.id_jenis_simpanan}
                        onClick={() => setSelectedJenis(j)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                          selectedJenis?.id_jenis_simpanan === j.id_jenis_simpanan
                            ? 'border-[#2a7fc5] bg-blue-50 ring-2 ring-[#2a7fc5]/20'
                            : 'border-surface-300 bg-white hover:border-ink-200 hover:bg-surface-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                            selectedJenis?.id_jenis_simpanan === j.id_jenis_simpanan
                              ? 'bg-[#2a7fc5] text-white'
                              : 'bg-surface-100 text-ink-500'
                          )}>
                            {j.kode_jenis.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">{j.nama_jenis}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {j.is_wajib && (
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Wajib</span>
                              )}
                              {j.deskripsi && (
                                <span className="text-[10px] text-ink-300 truncate max-w-[180px]">{j.deskripsi}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Nominal tetap badge */}
                        {j.nominal_tetap > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0 ml-2">
                            {formatRupiah(j.nominal_tetap)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Info saldo anggota */}
                {selectedAnggota && selectedJenis && (
                  <div className={cn(
                    'flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-xs',
                    loadingSaldo ? 'bg-surface-100' : 'bg-blue-50'
                  )}>
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {loadingSaldo
                      ? <span className="text-ink-400">Memuat saldo...</span>
                      : <span className="text-blue-700">
                          Saldo {selectedJenis.nama_jenis}: <strong>{formatRupiah(saldoInfo?.saldo ?? 0)}</strong>
                        </span>}
                  </div>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tanggal Transaksi</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className={inputCls} />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Nominal <span className="text-red-400">*</span>
                  {nominalLocked && (
                    <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      Nominal tetap otomatis
                    </span>
                  )}
                </label>
                <div className={cn(
                  'flex items-center gap-2 px-3 h-11 rounded-xl border transition-all',
                  nominalLocked
                    ? 'bg-surface-100 border-surface-200 cursor-not-allowed'
                    : 'border-surface-300 bg-surface-50 focus-within:border-[#2a7fc5] focus-within:ring-2 focus-within:ring-[#2a7fc5]/20 focus-within:bg-white'
                )}>
                  <span className="text-sm font-semibold text-ink-400 shrink-0">Rp</span>
                  <input
                    value={nominalInput}
                    onChange={e => handleNominalInput(e.target.value)}
                    readOnly={nominalLocked}
                    placeholder="0"
                    className={cn(
                      'flex-1 text-sm text-ink-800 bg-transparent outline-none',
                      nominalLocked && 'cursor-not-allowed text-ink-500'
                    )}
                  />
                  {nominalLocked && selectedJenis && (
                    <button
                      onClick={() => { setNominalLocked(false); setNominalInput(''); setNominal(0) }}
                      className="text-[10px] text-ink-400 hover:text-red-400 transition-colors shrink-0"
                    >
                      Ubah
                    </button>
                  )}
                </div>
                {nominalLocked && selectedJenis && (
                  <p className="text-[10px] text-ink-300 mt-1">
                    Nominal diisi otomatis dari jenis simpanan "{selectedJenis.nama_jenis}". Klik "Ubah" untuk mengganti manual.
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Keterangan</label>
                <input
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Opsional"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-surface-200 shrink-0">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedAnggota || !selectedJenis || nominal <= 0}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all',
              'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              tipe === 'setor' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
            )}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
              : tipe === 'setor'
              ? <><ArrowDownCircle className="w-4 h-4" />Simpan Setoran</>
              : <><ArrowUpCircle className="w-4 h-4" />Simpan Penarikan</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function SimpananPage() {
  const [data, setData]           = useState<Simpanan[]>([])
  const [meta, setMeta]           = useState({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [tipeFilter, setTipeFilter] = useState<'' | 'setor' | 'tarik'>('')
  const [page, setPage]           = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultTipe, setDefaultTipe] = useState<'setor' | 'tarik'>('setor')
  const [counts, setCounts]       = useState({ setor: 0, tarik: 0, semua: 0 })

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * LIMIT),
        limit: String(LIMIT),
        ...(tipeFilter ? { tipe_transaksi: tipeFilter } : {}),
      })
      const res = await api.get<PaginatedResponse>(`/simpanan?${params}`)
      setData(res.data)
      setMeta({ total: res.meta.total, page: res.meta.page, total_pages: res.meta.total_pages })

      // Fetch counts
      try {
        const [all, setor, tarik] = await Promise.all([
          api.get<PaginatedResponse>('/simpanan?limit=1'),
          api.get<PaginatedResponse>('/simpanan?limit=1&tipe_transaksi=setor'),
          api.get<PaginatedResponse>('/simpanan?limit=1&tipe_transaksi=tarik'),
        ])
        setCounts({ semua: all.meta.total, setor: setor.meta.total, tarik: tarik.meta.total })
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [page, tipeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const openModal = (tipe: 'setor' | 'tarik') => {
    setDefaultTipe(tipe)
    setModalOpen(true)
  }

  const STAT_CARDS = [
    { label: 'Total Setoran',   count: counts.setor, icon: TrendingUp,   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { label: 'Total Penarikan', count: counts.tarik, icon: TrendingDown, iconBg: 'bg-red-50',     iconColor: 'text-red-400'     },
    { label: 'Semua Transaksi', count: counts.semua, icon: Wallet,       iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
  ]

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-ink-800">Manajemen Simpanan</h2>
          <p className="text-xs text-ink-300">Kelola setoran dan penarikan simpanan anggota</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 transition-all"
            title="Refresh">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {/* Dua tombol: Setor & Tarik */}
          <button onClick={() => openModal('tarik')}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 flex items-center gap-1.5 transition-all">
            <ArrowUpCircle className="w-3.5 h-3.5" /> Tarik
          </button>
          <button onClick={() => openModal('setor')}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-all bg-emerald-500">
            <ArrowDownCircle className="w-3.5 h-3.5" /> Setor
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-surface-300 shadow-card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
              <card.icon className={cn('w-5 h-5', card.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800 leading-none">{card.count}</p>
              <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search bar */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            placeholder="Cari no. transaksi, nama..."
            className="w-full h-9 pl-9 pr-3 rounded-full border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] placeholder:text-ink-200 bg-surface-50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { value: '' as const,      label: 'Semua' },
            { value: 'setor' as const, label: 'Setor' },
            { value: 'tarik' as const, label: 'Tarik' },
          ]).map(pill => (
            <button key={pill.value}
              onClick={() => { setTipeFilter(pill.value); setPage(1) }}
              className={cn(
                'h-8 px-4 rounded-full text-xs font-semibold border transition-all',
                tipeFilter === pill.value
                  ? 'bg-ink-800 text-white border-ink-800'
                  : 'bg-white border-surface-300 text-ink-600 hover:border-ink-300'
              )}>
              {pill.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={fetchData} className="text-ink-300 hover:text-ink-600 transition-colors">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <span className="text-xs text-ink-300">{meta.total} transaksi</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {['NO. TRANSAKSI', 'ANGGOTA', 'JENIS', 'TIPE', 'NOMINAL', 'SALDO AKHIR', 'TANGGAL', 'KETERANGAN'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-ink-300 tracking-widest uppercase px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-ink-300 mx-auto mb-2" />
                <p className="text-xs text-ink-300">Memuat data...</p>
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16">
                <PiggyBank className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-sm text-ink-300">Belum ada transaksi simpanan</p>
              </td></tr>
            ) : (
              data.map((s, idx) => (
                <tr key={s.id_simpanan}
                  className={cn('border-b border-surface-100 hover:bg-surface-50 transition-colors',
                    idx === data.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3 text-xs font-mono text-ink-400 whitespace-nowrap">{s.no_transaksi}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* ── Avatar siluet orang ── */}
                      <Avatar size="sm" />
                      <span className="font-semibold text-ink-800 whitespace-nowrap">{s.nama_anggota ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{s.nama_jenis_simpanan ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      s.tipe_transaksi === 'setor' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    )}>
                      {s.tipe_transaksi === 'setor'
                        ? <><ArrowDownCircle className="w-3 h-3" />Setor</>
                        : <><ArrowUpCircle className="w-3 h-3" />Tarik</>}
                    </span>
                  </td>
                  <td className={cn('px-4 py-3 font-bold whitespace-nowrap',
                    s.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-red-500')}>
                    {s.tipe_transaksi === 'setor' ? '+' : '-'}{formatRupiah(s.nominal)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-800 whitespace-nowrap">{formatRupiah(s.saldo_akhir)}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{s.tanggal_transaksi}</td>
                  <td className="px-4 py-3 text-ink-400 text-xs">{s.keterangan || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal */}
      <ModalTransaksi
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
        defaultTipe={defaultTipe}
      />
    </div>
  )
}