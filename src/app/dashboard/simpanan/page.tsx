'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, Search, RefreshCw, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  PiggyBank, TrendingUp, TrendingDown, Wallet, Info
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

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

interface SaldoItem {
  id_jenis_simpanan: number
  nama_jenis_simpanan: string
  is_wajib: boolean
  saldo: number
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
// Avatar
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
// Shared: AnggotaPicker
// ============================================================================

interface AnggotaPickerProps {
  selectedAnggota: Anggota | null
  onSelect: (a: Anggota) => void
  onClear: () => void
  accentColor?: 'blue' | 'red'
}

function AnggotaPicker({ selectedAnggota, onSelect, onClear, accentColor = 'blue' }: AnggotaPickerProps) {
  const [search, setSearch]         = useState('')
  const [list, setList]             = useState<Anggota[]>([])
  const [showDrop, setShowDrop]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const ref                         = useRef<HTMLDivElement>(null)

  const inputCls = accentColor === 'red'
    ? 'w-full h-10 pl-9 pr-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'
    : 'w-full h-10 pl-9 pr-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'

  const selectedBorder = accentColor === 'red'
    ? 'border-red-300 bg-red-50'
    : 'border-[#2a7fc5] bg-blue-50 ring-2 ring-[#2a7fc5]/20'

  useEffect(() => {
    if (!search.trim()) { setList([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get<{ data: Anggota[] }>(
          `/anggota?search=${encodeURIComponent(search)}&limit=6&status=aktif`
        )
        setList(res.data)
      } catch { setList([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (selectedAnggota) {
    return (
      <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl border', selectedBorder)}>
        <Avatar size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-800 truncate">{selectedAnggota.nama_lengkap}</p>
          <p className="text-xs text-ink-400">{selectedAnggota.no_anggota}</p>
        </div>
        <button onClick={onClear} className="text-ink-300 hover:text-ink-600 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
          onFocus={() => search && setShowDrop(true)}
          placeholder="Cari nama atau no. anggota..."
          className={inputCls}
        />
      </div>
      {showDrop && search && (
        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-surface-300 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {loading
            ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-ink-300" /></div>
            : list.length === 0
            ? <p className="text-xs text-ink-300 text-center py-4">Anggota tidak ditemukan</p>
            : list.map(a => (
              <button key={a.id_anggota}
                onClick={() => { onSelect(a); setShowDrop(false); setSearch('') }}
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
    </div>
  )
}

// ============================================================================
// Modal Setor — pilih jenis simpanan
// ============================================================================

function ModalSetor({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)
  const [jenisList, setJenisList]             = useState<JenisSimpanan[]>([])
  const [selectedJenis, setSelectedJenis]     = useState<JenisSimpanan | null>(null)
  const [tanggal, setTanggal]                 = useState(new Date().toISOString().slice(0, 10))
  const [nominal, setNominal]                 = useState(0)
  const [nominalInput, setNominalInput]       = useState('')
  const [nominalLocked, setNominalLocked]     = useState(false)
  const [keterangan, setKeterangan]           = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedAnggota(null); setSelectedJenis(null)
      setTanggal(new Date().toISOString().slice(0, 10))
      setNominal(0); setNominalInput(''); setNominalLocked(false)
      setKeterangan(''); setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    api.get<JenisSimpanan[]>('/simpanan/jenis?is_active=true').then(setJenisList).catch(() => setJenisList([]))
  }, [open])

  useEffect(() => {
    if (!selectedJenis) return
    if (selectedJenis.nominal_tetap > 0) {
      setNominal(selectedJenis.nominal_tetap)
      setNominalInput(selectedJenis.nominal_tetap.toLocaleString('id-ID'))
      setNominalLocked(true)
    } else {
      setNominal(0); setNominalInput(''); setNominalLocked(false)
    }
  }, [selectedJenis])

  const handleNominalInput = (val: string) => {
    if (nominalLocked) return
    const num = parseAngka(val)
    setNominal(num)
    setNominalInput(num > 0 ? num.toLocaleString('id-ID') : '')
  }

  const handleSubmit = async () => {
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu.'); return }
    if (!selectedJenis)   { setError('Pilih jenis simpanan.'); return }
    if (nominal <= 0)     { setError('Nominal harus lebih dari 0.'); return }
    setError(null); setLoading(true)
    try {
      await api.post('/simpanan/setor', {
        id_anggota: selectedAnggota.id_anggota,
        id_jenis_simpanan: selectedJenis.id_jenis_simpanan,
        tanggal_transaksi: tanggal,
        tipe_transaksi: 'setor',
        nominal,
        keterangan: keterangan.trim() || null,
      })
      onSaved(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.')
    } finally { setLoading(false) }
  }

  if (!open) return null

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink-800">Setor Simpanan</h2>
              <p className="text-xs text-ink-300">Tambah setoran simpanan anggota</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Data Anggota</p>
            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Anggota <span className="text-red-400">*</span></label>
            <AnggotaPicker
              selectedAnggota={selectedAnggota}
              onSelect={setSelectedAnggota}
              onClear={() => setSelectedAnggota(null)}
              accentColor="blue"
            />
          </div>

          <div className="border-t border-surface-200" />

          <div>
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-3">Detail Transaksi</p>
            <div className="space-y-4">
              {/* Jenis Simpanan */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Jenis Simpanan <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {jenisList.length === 0
                    ? <p className="text-xs text-ink-300 py-2">Memuat jenis simpanan...</p>
                    : jenisList.map(j => (
                      <button key={j.id_jenis_simpanan} onClick={() => setSelectedJenis(j)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                          selectedJenis?.id_jenis_simpanan === j.id_jenis_simpanan
                            ? 'border-[#2a7fc5] bg-blue-50 ring-2 ring-[#2a7fc5]/20'
                            : 'border-surface-300 bg-white hover:border-ink-200 hover:bg-surface-50'
                        )}>
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                            selectedJenis?.id_jenis_simpanan === j.id_jenis_simpanan ? 'bg-[#2a7fc5] text-white' : 'bg-surface-100 text-ink-500')}>
                            {j.kode_jenis}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">{j.nama_jenis}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {j.is_wajib && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Wajib</span>}
                              {j.deskripsi && <span className="text-[10px] text-ink-300 truncate max-w-[180px]">{j.deskripsi}</span>}
                            </div>
                          </div>
                        </div>
                        {j.nominal_tetap > 0 && (
                          <div className="shrink-0 ml-2 text-right">
                            <p className="text-xs font-bold text-emerald-600">{formatRupiah(j.nominal_tetap)}</p>
                            <p className="text-[10px] text-ink-300">nominal</p>
                          </div>
                        )}
                      </button>
                    ))
                  }
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tanggal Transaksi <span className="text-red-400">*</span></label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Nominal <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400 font-medium">Rp</span>
                  <input value={nominalInput} onChange={e => handleNominalInput(e.target.value)} placeholder="0"
                    disabled={nominalLocked}
                    className={cn(inputCls, 'pl-9', nominalLocked && 'opacity-70 cursor-not-allowed bg-surface-100')} />
                  {nominalLocked && (
                    <button onClick={() => setNominalLocked(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#2a7fc5] font-semibold hover:underline">Ubah</button>
                  )}
                </div>
                {nominalLocked && <p className="text-[10px] text-ink-300 mt-1">Nominal otomatis dari jenis simpanan. Klik "Ubah" untuk mengganti.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Keterangan</label>
                <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Opsional" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-surface-200 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all">Batal</button>
          <button onClick={handleSubmit}
            disabled={loading || !selectedAnggota || !selectedJenis || nominal <= 0}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><ArrowDownCircle className="w-4 h-4" />Simpan Setoran</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Modal Tarik — otomatis Simpanan Sukarela, tanpa pilih jenis
// ============================================================================

function ModalTarik({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)
  const [saldoSukarela, setSaldoSukarela]     = useState<number | null>(null)
  const [idJenisSukarela, setIdJenisSukarela] = useState<number | null>(null)
  const [loadingSaldo, setLoadingSaldo]       = useState(false)
  const [tanggal, setTanggal]                 = useState(new Date().toISOString().slice(0, 10))
  const [nominal, setNominal]                 = useState(0)
  const [nominalInput, setNominalInput]       = useState('')
  const [keterangan, setKeterangan]           = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedAnggota(null); setSaldoSukarela(null); setIdJenisSukarela(null)
      setTanggal(new Date().toISOString().slice(0, 10))
      setNominal(0); setNominalInput('')
      setKeterangan(''); setError(null)
    }
  }, [open])

  // Fetch saldo Simpanan Sukarela saat anggota dipilih
  useEffect(() => {
    if (!selectedAnggota) { setSaldoSukarela(null); setIdJenisSukarela(null); return }
    setLoadingSaldo(true)
    api.get<SaldoItem[]>(`/simpanan/saldo/${selectedAnggota.id_anggota}`)
      .then(list => {
        console.log('[DEBUG saldo]', JSON.stringify(list))

        // Cari jenis yang bisa ditarik bebas:
        // Prioritas 1 — is_wajib === false (jika backend sudah return field ini)
        // Prioritas 2 — nama mengandung "sukarela" (fallback jika backend belum update)
        // Prioritas 3 — jenis apapun yang is_wajib !== true
        const cari = (arr: SaldoItem[]) =>
          arr.find(s => s.is_wajib === false)
          ?? arr.find(s => s.nama_jenis_simpanan?.toLowerCase().includes('sukarela'))
          ?? arr.find(s => !s.is_wajib)

        const denganSaldo = cari(list.filter(s => s.saldo > 0))
        const tanpaSaldo  = cari(list)
        const sukarela    = denganSaldo ?? tanpaSaldo

        console.log('[DEBUG sukarela]', sukarela)

        if (sukarela) {
          setSaldoSukarela(sukarela.saldo)
          setIdJenisSukarela(sukarela.id_jenis_simpanan)
        } else {
          setSaldoSukarela(0); setIdJenisSukarela(null)
        }
      })
      .catch((err) => {
        console.error('[DEBUG saldo error]', err)
        setSaldoSukarela(0); setIdJenisSukarela(null)
      })
      .finally(() => setLoadingSaldo(false))
  }, [selectedAnggota])

  const handleNominalInput = (val: string) => {
    const num = parseAngka(val)
    setNominal(num)
    setNominalInput(num > 0 ? num.toLocaleString('id-ID') : '')
  }

  const handleSubmit = async () => {
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu.'); return }
    if (nominal <= 0)     { setError('Nominal harus lebih dari 0.'); return }
    if (!idJenisSukarela) { setError('Anggota tidak memiliki Simpanan Sukarela.'); return }
    if (saldoSukarela !== null && nominal > saldoSukarela) {
      setError(`Saldo tidak cukup. Saldo Sukarela tersedia: ${formatRupiah(saldoSukarela)}`); return
    }
    setError(null); setLoading(true)
    try {
      await api.post('/simpanan/tarik', {
        id_anggota:        selectedAnggota.id_anggota,
        id_jenis_simpanan: idJenisSukarela,
        tanggal_transaksi: tanggal,
        tipe_transaksi:    'tarik',
        nominal,
        keterangan:        keterangan.trim() || null,
      })
      onSaved(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.')
    } finally { setLoading(false) }
  }

  if (!open) return null

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'
  const saldoCukup = saldoSukarela !== null && nominal > 0 && nominal <= saldoSukarela

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink-800">Tarik Simpanan</h2>
              <p className="text-xs text-ink-300">Penarikan dari Simpanan Sukarela</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Anggota */}
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Anggota <span className="text-red-400">*</span></label>
            <AnggotaPicker
              selectedAnggota={selectedAnggota}
              onSelect={setSelectedAnggota}
              onClear={() => { setSelectedAnggota(null); setSaldoSukarela(null); setIdJenisSukarela(null) }}
              accentColor="red"
            />
          </div>

          {/* Card saldo Sukarela */}
          {selectedAnggota && (
            <div className={cn(
              'flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
              loadingSaldo ? 'bg-surface-50 border-surface-200'
                : saldoSukarela === 0 ? 'bg-red-50 border-red-100'
                : 'bg-emerald-50 border-emerald-100'
            )}>
              <div className="flex items-center gap-2.5">
                <PiggyBank className={cn('w-4 h-4 shrink-0',
                  loadingSaldo ? 'text-ink-300' : saldoSukarela === 0 ? 'text-red-400' : 'text-emerald-500')} />
                <div>
                  <p className="text-xs font-semibold text-ink-700">Simpanan Sukarela</p>
                  <p className="text-[10px] text-ink-400">Saldo yang dapat ditarik</p>
                </div>
              </div>
              {loadingSaldo
                ? <Loader2 className="w-4 h-4 animate-spin text-ink-300" />
                : <span className={cn('text-base font-bold',
                    saldoSukarela === 0 ? 'text-red-500' : 'text-emerald-600')}>
                    {saldoSukarela !== null ? formatRupiah(saldoSukarela) : '—'}
                  </span>
              }
            </div>
          )}

          {/* Peringatan tidak ada Simpanan Sukarela */}
          {selectedAnggota && !loadingSaldo && !idJenisSukarela && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-100">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">Anggota ini belum memiliki Simpanan Sukarela atau saldo kosong.</p>
            </div>
          )}

          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tanggal Transaksi <span className="text-red-400">*</span></label>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className={inputCls} />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Nominal <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400 font-medium">Rp</span>
              <input value={nominalInput} onChange={e => handleNominalInput(e.target.value)} placeholder="0"
                className={cn(inputCls, 'pl-9')} />
            </div>
            {selectedAnggota && saldoSukarela !== null && nominal > 0 && !loadingSaldo && (
              <p className={cn('text-[10px] mt-1', saldoCukup ? 'text-emerald-600' : 'text-red-500')}>
                {saldoCukup
                  ? `Sisa saldo setelah tarik: ${formatRupiah(saldoSukarela - nominal)}`
                  : `Melebihi saldo. Maksimal: ${formatRupiah(saldoSukarela)}`}
              </p>
            )}
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Keterangan</label>
            <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Opsional" className={inputCls} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-surface-200 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all">Batal</button>
          <button onClick={handleSubmit}
            disabled={loading || !selectedAnggota || nominal <= 0 || !idJenisSukarela || (saldoSukarela !== null && nominal > saldoSukarela)}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><ArrowUpCircle className="w-4 h-4" />Simpan Penarikan</>}
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
  const [data, setData]             = useState<Simpanan[]>([])
  const [meta, setMeta]             = useState({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [tipeFilter, setTipeFilter] = useState<'' | 'setor' | 'tarik'>('')
  const [page, setPage]             = useState(1)
  const [modalSetor, setModalSetor] = useState(false)
  const [modalTarik, setModalTarik] = useState(false)
  const [counts, setCounts]         = useState({ setor: 0, tarik: 0, semua: 0 })
  const { user } = useAuth()
  // Setor & Tarik hanya admin dan bendahara, ketua hanya bisa lihat
  const canTransaksi = user?.role === 'admin' || user?.role === 'bendahara'

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * LIMIT), limit: String(LIMIT),
        ...(tipeFilter ? { tipe_transaksi: tipeFilter } : {}),
      })
      const res = await api.get<PaginatedResponse>(`/simpanan?${params}`)
      setData(res.data)
      setMeta({ total: res.meta.total, page: res.meta.page, total_pages: res.meta.total_pages })
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
    } finally { setLoading(false) }
  }, [page, tipeFilter])

  useEffect(() => { fetchData() }, [fetchData])

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
            className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 transition-all" title="Refresh">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {canTransaksi && (
            <>
              <button onClick={() => setModalTarik(true)}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 flex items-center gap-1.5 transition-all">
                <ArrowUpCircle className="w-3.5 h-3.5" /> Tarik
              </button>
              <button onClick={() => setModalSetor(true)}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-all bg-emerald-500">
                <ArrowDownCircle className="w-3.5 h-3.5" /> Setor
              </button>
            </>
          )}
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

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input placeholder="Cari no. transaksi, nama..."
            className="w-full h-9 pl-9 pr-3 rounded-full border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] placeholder:text-ink-200 bg-surface-50 transition-all" />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { value: '' as const,      label: 'Semua' },
            { value: 'setor' as const, label: 'Setor' },
            { value: 'tarik' as const, label: 'Tarik' },
          ]).map(pill => (
            <button key={pill.value} onClick={() => { setTipeFilter(pill.value); setPage(1) }}
              className={cn('h-8 px-4 rounded-full text-xs font-semibold border transition-all',
                tipeFilter === pill.value ? 'bg-ink-800 text-white border-ink-800' : 'bg-white border-surface-300 text-ink-600 hover:border-ink-300')}>
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
                <th key={h} className="text-left text-[10px] font-bold text-ink-300 tracking-widest uppercase px-4 py-3 whitespace-nowrap">{h}</th>
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
                  className={cn('border-b border-surface-100 hover:bg-surface-50 transition-colors', idx === data.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3 text-xs font-mono text-ink-400 whitespace-nowrap">{s.no_transaksi}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" />
                      <span className="font-semibold text-ink-800 whitespace-nowrap">{s.nama_anggota ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{s.nama_jenis_simpanan ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      s.tipe_transaksi === 'setor' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')}>
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

      <ModalSetor open={modalSetor} onClose={() => setModalSetor(false)} onSaved={fetchData} />
      <ModalTarik open={modalTarik} onClose={() => setModalTarik(false)} onSaved={fetchData} />
    </div>
  )
}