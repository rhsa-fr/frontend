'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Search, Pencil, Save, X, AlertCircle, Loader2,
  Phone, Mail, MapPin, Briefcase, Calendar, CreditCard,
  PiggyBank, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, AlertTriangle
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
  email?: string
  no_telepon?: string
  tanggal_bergabung: string
  status: 'aktif' | 'non-aktif' | 'keluar'
}

interface ProfilAnggota {
  nik?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'L' | 'P'
  alamat?: string
  kota?: string
  provinsi?: string
  kode_pos?: string
  pekerjaan?: string
}

interface DetailAnggota extends Anggota {
  profil?: ProfilAnggota
  total_simpanan?: number
  total_pinjaman_aktif?: number
}

interface Simpanan {
  id_simpanan: number
  no_transaksi: string
  tanggal_transaksi: string
  tipe_transaksi: 'setor' | 'tarik'
  nominal: number
  saldo_akhir: number
  nama_jenis_simpanan?: string
  keterangan?: string
}

interface Pinjaman {
  id_pinjaman: number
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  total_pinjaman: number
  sisa_pinjaman: number
  lama_angsuran: number
  nominal_angsuran: number
  bunga_persen: number
  keperluan?: string
  status: 'menunggu' | 'disetujui' | 'ditolak' | 'lunas'
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_ANGGOTA = {
  aktif:       { label: 'Aktif',     color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'non-aktif': { label: 'Non-Aktif', color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400'   },
  keluar:      { label: 'Keluar',    color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-400'     },
}

const STATUS_PINJAMAN = {
  menunggu:  { label: 'Menunggu',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
  disetujui: { label: 'Disetujui', color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle2 },
  ditolak:   { label: 'Ditolak',   color: 'text-red-500',     bg: 'bg-red-50',     icon: XCircle },
  lunas:     { label: 'Lunas',     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
}

// ============================================================================
// Helpers
// ============================================================================

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// ============================================================================
// Avatar
// ============================================================================

function AnggotaAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const cls = {
    sm: { wrap: 'w-9 h-9 rounded-xl',    icon: 'w-4 h-4' },
    md: { wrap: 'w-12 h-12 rounded-xl',  icon: 'w-6 h-6' },
    lg: { wrap: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
    xl: { wrap: 'w-20 h-20 rounded-2xl', icon: 'w-10 h-10' },
  }[size]

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 flex-shrink-0', cls.wrap)}
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
    >
      <User className={cn(cls.icon, 'text-white')} />
    </div>
  )
}

// ============================================================================
// Tab Component
// ============================================================================

type TabKey = 'profil' | 'simpanan' | 'pinjaman'

// ============================================================================
// Main Page
// ============================================================================

export default function ProfilAnggotaPage() {
  const [anggotaList, setAnggotaList]     = useState<Anggota[]>([])
  const [searchInput, setSearchInput]     = useState('')
  const [searchQuery, setSearchQuery]     = useState('')
  const [showDropdown, setShowDropdown]   = useState(false)
  const [selected, setSelected]           = useState<DetailAnggota | null>(null)
  const [loadingList, setLoadingList]     = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab]         = useState<TabKey>('profil')

  // Profil edit
  const [editMode, setEditMode] = useState(false)
  const [profil, setProfil]     = useState<ProfilAnggota>({})
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Riwayat Simpanan
  const [simpananList, setSimpananList]     = useState<Simpanan[]>([])
  const [loadingSimpanan, setLoadingSimpanan] = useState(false)

  // Riwayat Pinjaman
  const [pinjamanList, setPinjamanList]     = useState<Pinjaman[]>([])
  const [loadingPinjaman, setLoadingPinjaman] = useState(false)

  // ── Fetch search list ──────────────────────────────────────────────────────
  const fetchList = useCallback(async (q: string) => {
    if (!q.trim()) { setAnggotaList([]); return }
    setLoadingList(true)
    try {
      const res = await api.get<{ data: Anggota[] }>(`/anggota?search=${encodeURIComponent(q)}&limit=8`)
      setAnggotaList(res.data)
    } catch { setAnggotaList([]) }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchList(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, fetchList])

  // ── Fetch simpanan riwayat ────────────────────────────────────────────────
  const fetchSimpanan = useCallback(async (id: number) => {
    setLoadingSimpanan(true)
    try {
      const res = await api.get<{ data: Simpanan[] }>(`/simpanan?id_anggota=${id}&limit=20`)
      setSimpananList(res.data)
    } catch { setSimpananList([]) }
    finally { setLoadingSimpanan(false) }
  }, [])

  // ── Fetch pinjaman riwayat ────────────────────────────────────────────────
  const fetchPinjaman = useCallback(async (id: number) => {
    setLoadingPinjaman(true)
    try {
      const res = await api.get<{ data: Pinjaman[] }>(`/pinjaman?id_anggota=${id}&limit=20`)
      setPinjamanList(res.data)
    } catch { setPinjamanList([]) }
    finally { setLoadingPinjaman(false) }
  }, [])

  // ── Pilih anggota ─────────────────────────────────────────────────────────
  const selectAnggota = async (a: Anggota) => {
    setShowDropdown(false)
    setSearchInput(a.nama_lengkap)
    setSearchQuery('')
    setEditMode(false)
    setError(null)
    setActiveTab('profil')
    setLoadingDetail(true)
    try {
      const detail = await api.get<DetailAnggota>(`/anggota/${a.id_anggota}/detail`)
      setSelected(detail)
      setProfil(detail.profil ?? {})
      fetchSimpanan(a.id_anggota)
      fetchPinjaman(a.id_anggota)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail.')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Simpan profil ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await api.post(`/anggota/${selected.id_anggota}/profil`, profil)
      const detail = await api.get<DetailAnggota>(`/anggota/${selected.id_anggota}/detail`)
      setSelected(detail)
      setProfil(detail.profil ?? {})
      setEditMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls    = 'w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200'
  const readonlyCls = 'w-full min-h-[40px] px-3 py-2 rounded-lg bg-surface-100 border border-surface-200 text-sm text-ink-600 flex items-center'

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profil',   label: 'Data Profil',       icon: User       },
    { key: 'simpanan', label: 'Riwayat Simpanan',   icon: PiggyBank  },
    { key: 'pinjaman', label: 'Riwayat Pinjaman',   icon: CreditCard },
  ]

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink-800">Detail Profil Anggota</h1>
          <p className="text-xs text-ink-300 mt-0.5">Lihat dan perbarui data lengkap anggota koperasi</p>
        </div>
        {selected && activeTab === 'profil' && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            <Pencil className="w-4 h-4" /> Update Profil
          </button>
        )}
        {editMode && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditMode(false); setProfil(selected?.profil ?? {}) }}
              className="h-9 px-4 rounded-xl text-sm font-medium border border-surface-300 text-ink-600 hover:bg-surface-100 flex items-center gap-1.5 transition-all"
            >
              <X className="w-4 h-4" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan</>}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Search Box ── */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card p-5">
        <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide mb-3">Pilih Anggota</p>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value)
              setSearchQuery(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) { setSelected(null); setAnggotaList([]) }
            }}
            onFocus={() => searchQuery && setShowDropdown(true)}
            placeholder="Cari anggota berdasarkan nama atau no. anggota..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-surface-300 text-sm text-ink-800
                       outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                       placeholder:text-ink-200 bg-surface-50 focus:bg-white transition-all"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSelected(null); setAnggotaList([]); setShowDropdown(false) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && (searchQuery || loadingList) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-surface-300 shadow-lg z-20 overflow-hidden">
              {loadingList ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
                </div>
              ) : anggotaList.length === 0 ? (
                <p className="text-sm text-ink-300 text-center py-6">Anggota tidak ditemukan</p>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-surface-100">
                  {anggotaList.map(a => (
                    <button
                      key={a.id_anggota}
                      onClick={() => selectAnggota(a)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left"
                    >
                      <AnggotaAvatar size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink-800 truncate">{a.nama_lengkap}</p>
                        <p className="text-xs text-ink-400">{a.no_anggota}</p>
                      </div>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                        STATUS_ANGGOTA[a.status]?.bg, STATUS_ANGGOTA[a.status]?.color)}>
                        {STATUS_ANGGOTA[a.status]?.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading detail */}
      {loadingDetail && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
        </div>
      )}

      {/* ── Detail Anggota ── */}
      {selected && !loadingDetail && (
        <div className="space-y-4">

          {/* Card identitas */}
          <div className="bg-white rounded-xl border border-surface-300 shadow-card p-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 flex-shrink-0">
                <AnggotaAvatar size="xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-ink-800">{selected.nama_lengkap}</h2>
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                    STATUS_ANGGOTA[selected.status]?.bg, STATUS_ANGGOTA[selected.status]?.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_ANGGOTA[selected.status]?.dot)} />
                    {STATUS_ANGGOTA[selected.status]?.label}
                  </span>
                </div>
                <p className="text-xs font-mono text-ink-400 mt-0.5">{selected.no_anggota}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {selected.email && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-400">
                      <Mail className="w-3.5 h-3.5" />{selected.email}
                    </span>
                  )}
                  {selected.no_telepon && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-400">
                      <Phone className="w-3.5 h-3.5" />{selected.no_telepon}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-ink-400">
                    <Calendar className="w-3.5 h-3.5" />Bergabung {selected.tanggal_bergabung}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Simpanan</p>
                <p className="text-lg font-bold text-emerald-700">{formatRupiah(selected.total_simpanan ?? 0)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Pinjaman Aktif</p>
                <p className="text-lg font-bold text-blue-700">{formatRupiah(selected.total_pinjaman_aktif ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-surface-200 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-semibold transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-ink-800 shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Data Profil ── */}
          {activeTab === 'profil' && (
            <div className="bg-white rounded-xl border border-surface-300 shadow-card p-5">
              <h3 className="text-sm font-bold text-ink-800 mb-4">Data Profil Lengkap</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <CreditCard className="w-3.5 h-3.5" />NIK
                  </label>
                  {editMode
                    ? <input value={profil.nik ?? ''} onChange={e => setProfil(p => ({ ...p, nik: e.target.value }))} placeholder="16 digit NIK" className={inputCls} maxLength={16} />
                    : <div className={readonlyCls}>{profil.nik || <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <User className="w-3.5 h-3.5" />Jenis Kelamin
                  </label>
                  {editMode
                    ? (
                      <select value={profil.jenis_kelamin ?? ''} onChange={e => setProfil(p => ({ ...p, jenis_kelamin: (e.target.value as 'L' | 'P') || undefined }))} className={inputCls}>
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    )
                    : <div className={readonlyCls}>{profil.jenis_kelamin === 'L' ? 'Laki-laki' : profil.jenis_kelamin === 'P' ? 'Perempuan' : <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" />Tempat Lahir
                  </label>
                  {editMode
                    ? <input value={profil.tempat_lahir ?? ''} onChange={e => setProfil(p => ({ ...p, tempat_lahir: e.target.value }))} placeholder="Kota tempat lahir" className={inputCls} />
                    : <div className={readonlyCls}>{profil.tempat_lahir || <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" />Tanggal Lahir
                  </label>
                  {editMode
                    ? <input type="date" value={profil.tanggal_lahir ?? ''} onChange={e => setProfil(p => ({ ...p, tanggal_lahir: e.target.value }))} className={inputCls} />
                    : <div className={readonlyCls}>{profil.tanggal_lahir || <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <Briefcase className="w-3.5 h-3.5" />Pekerjaan
                  </label>
                  {editMode
                    ? <input value={profil.pekerjaan ?? ''} onChange={e => setProfil(p => ({ ...p, pekerjaan: e.target.value }))} placeholder="Pekerjaan" className={inputCls} />
                    : <div className={readonlyCls}>{profil.pekerjaan || <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" />Kota
                  </label>
                  {editMode
                    ? <input value={profil.kota ?? ''} onChange={e => setProfil(p => ({ ...p, kota: e.target.value }))} placeholder="Kota domisili" className={inputCls} />
                    : <div className={readonlyCls}>{profil.kota || <span className="text-ink-300">Belum diisi</span>}</div>}
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" />Alamat Lengkap
                  </label>
                  {editMode
                    ? <textarea value={profil.alamat ?? ''} onChange={e => setProfil(p => ({ ...p, alamat: e.target.value }))} placeholder="Alamat lengkap" rows={2}
                        className="w-full px-3 py-2.5 rounded-lg border border-surface-300 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-surface-50 focus:bg-white transition-all placeholder:text-ink-200 resize-none" />
                    : <div className="min-h-[40px] px-3 py-2.5 rounded-lg bg-surface-100 border border-surface-200 text-sm text-ink-600">
                        {profil.alamat || <span className="text-ink-300">Belum diisi</span>}
                      </div>}
                </div>

              </div>
            </div>
          )}

          {/* ── Tab: Riwayat Simpanan ── */}
          {activeTab === 'simpanan' && (
            <div className="bg-white rounded-xl border border-surface-300 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-800">Riwayat Transaksi Simpanan</h3>
                <span className="text-xs text-ink-300">{simpananList.length} transaksi</span>
              </div>

              {loadingSimpanan ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
                </div>
              ) : simpananList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <PiggyBank className="w-8 h-8 text-ink-200 mb-2" />
                  <p className="text-sm text-ink-300">Belum ada transaksi simpanan</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {simpananList.map(s => (
                    <div key={s.id_simpanan} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 transition-colors">
                      {/* Icon tipe */}
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        s.tipe_transaksi === 'setor' ? 'bg-emerald-50' : 'bg-red-50')}>
                        {s.tipe_transaksi === 'setor'
                          ? <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                          : <ArrowUpCircle className="w-5 h-5 text-red-400" />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800">
                          {s.tipe_transaksi === 'setor' ? 'Setor' : 'Tarik'} — {s.nama_jenis_simpanan ?? '—'}
                        </p>
                        <p className="text-xs text-ink-400">{s.no_transaksi} · {s.tanggal_transaksi}</p>
                      </div>
                      {/* Nominal */}
                      <div className="text-right shrink-0">
                        <p className={cn('text-sm font-bold', s.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-red-500')}>
                          {s.tipe_transaksi === 'setor' ? '+' : '-'}{formatRupiah(s.nominal)}
                        </p>
                        <p className="text-xs text-ink-300">Saldo: {formatRupiah(s.saldo_akhir)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Riwayat Pinjaman ── */}
          {activeTab === 'pinjaman' && (
            <div className="bg-white rounded-xl border border-surface-300 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-800">Riwayat Pinjaman</h3>
                <span className="text-xs text-ink-300">{pinjamanList.length} pinjaman</span>
              </div>

              {loadingPinjaman ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
                </div>
              ) : pinjamanList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="w-8 h-8 text-ink-200 mb-2" />
                  <p className="text-sm text-ink-300">Belum ada riwayat pinjaman</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {pinjamanList.map(p => {
                    const st = STATUS_PINJAMAN[p.status] ?? STATUS_PINJAMAN.menunggu
                    const StIcon = st.icon
                    const persen = p.total_pinjaman > 0
                      ? Math.round(((p.total_pinjaman - p.sisa_pinjaman) / p.total_pinjaman) * 100)
                      : 0

                    return (
                      <div key={p.id_pinjaman} className="px-5 py-4 hover:bg-surface-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-ink-800">{p.no_pinjaman}</p>
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', st.bg, st.color)}>
                                <StIcon className="w-3 h-3" />{st.label}
                              </span>
                            </div>
                            <p className="text-xs text-ink-400 mt-0.5">
                              {p.keperluan ? `${p.keperluan} · ` : ''}{p.tanggal_pengajuan}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-ink-800">{formatRupiah(p.nominal_pinjaman)}</p>
                            <p className="text-xs text-ink-400">{p.lama_angsuran} bulan · {p.bunga_persen}%</p>
                          </div>
                        </div>

                        {/* Progress bar sisa pinjaman (hanya jika disetujui) */}
                        {p.status === 'disetujui' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-ink-400">Terlunasi {persen}%</span>
                              <span className="text-[10px] text-ink-400">Sisa: {formatRupiah(p.sisa_pinjaman)}</span>
                            </div>
                            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${persen}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Angsuran per bulan */}
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="text-[11px] text-ink-400">
                            Angsuran/bln: <span className="font-semibold text-ink-600">{formatRupiah(p.nominal_angsuran)}</span>
                          </span>
                          <span className="text-[11px] text-ink-400">
                            Total: <span className="font-semibold text-ink-600">{formatRupiah(p.total_pinjaman)}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Empty state */}
      {!selected && !loadingDetail && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #f0f4f8, #dce8f5)' }}>
            <User className="w-8 h-8 text-ink-300" />
          </div>
          <p className="text-sm font-medium text-ink-400">Pilih anggota untuk melihat profil</p>
          <p className="text-xs text-ink-300 mt-1">Ketik nama atau nomor anggota di kolom pencarian</p>
        </div>
      )}

    </div>
  )
}