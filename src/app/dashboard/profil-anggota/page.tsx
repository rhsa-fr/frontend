'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, Phone, Mail, MapPin, Briefcase, BadgeCheck, Calendar,
  Wallet, CreditCard, TrendingUp, TrendingDown, Edit3, X,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle,
  Search, RefreshCw, DollarSign, FileText, Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'

// ── Types ─────────────────────────────────────────────────────────────────────
type StatusAnggota = 'aktif' | 'non-aktif' | 'keluar'

interface ProfilAnggota {
  id_profil?: number
  id_anggota?: number
  nik?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'L' | 'P'
  alamat?: string
  kota?: string
  provinsi?: string
  kode_pos?: string
  pekerjaan?: string
  foto_profil?: string
}

interface AnggotaDetail {
  id_anggota: number
  no_anggota: string
  nama_lengkap: string
  email?: string
  no_telepon?: string
  tanggal_bergabung: string
  status: StatusAnggota
  profil?: ProfilAnggota
  total_simpanan?: number
  total_pinjaman_aktif?: number
}

interface Transaksi {
  id_simpanan: number
  no_transaksi: string
  tanggal_transaksi: string
  tipe_transaksi: 'setor' | 'tarik'
  nominal: number
  saldo_akhir: number
  keterangan?: string
  nama_jenis_simpanan?: string
}

interface Pinjaman {
  id_pinjaman: number
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  bunga_persen: number
  total_pinjaman: number
  lama_angsuran: number
  nominal_angsuran: number
  keperluan?: string
  status: string
  sisa_pinjaman: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; total_pages: number; skip: number; limit: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_ANGGOTA: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  aktif:       { label: 'Aktif',     dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'non-aktif': { label: 'Non-Aktif', dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'  },
  keluar:      { label: 'Keluar',    dot: 'bg-red-400',     bg: 'bg-red-50',     text: 'text-red-600'    },
}

// ── Data Wilayah Indonesia ────────────────────────────────────────────────────
const WILAYAH: Record<string, { kota: string; kodePos: string }[]> = {
  'Aceh':               [{ kota:'Banda Aceh', kodePos:'23111' },{ kota:'Sabang', kodePos:'23511' },{ kota:'Langsa', kodePos:'24411' },{ kota:'Lhokseumawe', kodePos:'24311' },{ kota:'Subulussalam', kodePos:'24882' }],
  'Sumatera Utara':     [{ kota:'Medan', kodePos:'20111' },{ kota:'Binjai', kodePos:'20711' },{ kota:'Tebing Tinggi', kodePos:'20611' },{ kota:'Pematangsiantar', kodePos:'21111' },{ kota:'Sibolga', kodePos:'22511' },{ kota:'Tanjungbalai', kodePos:'21311' },{ kota:'Padangsidimpuan', kodePos:'22711' },{ kota:'Gunungsitoli', kodePos:'22811' }],
  'Sumatera Barat':     [{ kota:'Padang', kodePos:'25111' },{ kota:'Bukittinggi', kodePos:'26111' },{ kota:'Payakumbuh', kodePos:'26211' },{ kota:'Sawahlunto', kodePos:'27411' },{ kota:'Solok', kodePos:'27311' },{ kota:'Padangpanjang', kodePos:'27111' },{ kota:'Pariaman', kodePos:'25511' }],
  'Riau':               [{ kota:'Pekanbaru', kodePos:'28111' },{ kota:'Dumai', kodePos:'28811' }],
  'Kepulauan Riau':     [{ kota:'Tanjungpinang', kodePos:'29111' },{ kota:'Batam', kodePos:'29411' }],
  'Jambi':              [{ kota:'Jambi', kodePos:'36111' },{ kota:'Sungai Penuh', kodePos:'37111' }],
  'Sumatera Selatan':   [{ kota:'Palembang', kodePos:'30111' },{ kota:'Prabumulih', kodePos:'31111' },{ kota:'Pagar Alam', kodePos:'31511' },{ kota:'Lubuklinggau', kodePos:'31611' }],
  'Bangka Belitung':    [{ kota:'Pangkalpinang', kodePos:'33111' }],
  'Bengkulu':           [{ kota:'Bengkulu', kodePos:'38111' }],
  'Lampung':            [{ kota:'Bandar Lampung', kodePos:'35111' },{ kota:'Metro', kodePos:'34111' }],
  'DKI Jakarta':        [{ kota:'Jakarta Pusat', kodePos:'10110' },{ kota:'Jakarta Utara', kodePos:'14110' },{ kota:'Jakarta Barat', kodePos:'11110' },{ kota:'Jakarta Selatan', kodePos:'12110' },{ kota:'Jakarta Timur', kodePos:'13110' }],
  'Jawa Barat':         [{ kota:'Bandung', kodePos:'40111' },{ kota:'Bogor', kodePos:'16111' },{ kota:'Bekasi', kodePos:'17111' },{ kota:'Depok', kodePos:'16411' },{ kota:'Cimahi', kodePos:'40511' },{ kota:'Cirebon', kodePos:'45111' },{ kota:'Sukabumi', kodePos:'43111' },{ kota:'Tasikmalaya', kodePos:'46111' },{ kota:'Banjar', kodePos:'46311' }],
  'Banten':             [{ kota:'Serang', kodePos:'42111' },{ kota:'Tangerang', kodePos:'15111' },{ kota:'Tangerang Selatan', kodePos:'15311' },{ kota:'Cilegon', kodePos:'42411' }],
  'Jawa Tengah':        [{ kota:'Semarang', kodePos:'50111' },{ kota:'Solo', kodePos:'57111' },{ kota:'Magelang', kodePos:'56111' },{ kota:'Salatiga', kodePos:'50711' },{ kota:'Pekalongan', kodePos:'51111' },{ kota:'Tegal', kodePos:'52111' },{ kota:'Purwokerto', kodePos:'53111' }],
  'DI Yogyakarta':      [{ kota:'Yogyakarta', kodePos:'55111' }],
  'Jawa Timur':         [{ kota:'Surabaya', kodePos:'60111' },{ kota:'Malang', kodePos:'65111' },{ kota:'Madiun', kodePos:'63111' },{ kota:'Kediri', kodePos:'64111' },{ kota:'Blitar', kodePos:'66111' },{ kota:'Mojokerto', kodePos:'61311' },{ kota:'Pasuruan', kodePos:'67111' },{ kota:'Probolinggo', kodePos:'67211' },{ kota:'Batu', kodePos:'65311' }],
  'Bali':               [{ kota:'Denpasar', kodePos:'80111' }],
  'Nusa Tenggara Barat':[{ kota:'Mataram', kodePos:'83111' },{ kota:'Bima', kodePos:'84111' }],
  'Nusa Tenggara Timur':[{ kota:'Kupang', kodePos:'85111' }],
  'Kalimantan Barat':   [{ kota:'Pontianak', kodePos:'78111' },{ kota:'Singkawang', kodePos:'79111' }],
  'Kalimantan Tengah':  [{ kota:'Palangkaraya', kodePos:'73111' }],
  'Kalimantan Selatan': [{ kota:'Banjarmasin', kodePos:'70111' },{ kota:'Banjarbaru', kodePos:'70711' }],
  'Kalimantan Timur':   [{ kota:'Samarinda', kodePos:'75111' },{ kota:'Balikpapan', kodePos:'76111' },{ kota:'Bontang', kodePos:'75311' }],
  'Kalimantan Utara':   [{ kota:'Tarakan', kodePos:'77111' }],
  'Sulawesi Utara':     [{ kota:'Manado', kodePos:'95111' },{ kota:'Bitung', kodePos:'95511' },{ kota:'Tomohon', kodePos:'95411' },{ kota:'Kotamobagu', kodePos:'95711' }],
  'Gorontalo':          [{ kota:'Gorontalo', kodePos:'96111' }],
  'Sulawesi Tengah':    [{ kota:'Palu', kodePos:'94111' }],
  'Sulawesi Barat':     [{ kota:'Mamuju', kodePos:'91511' }],
  'Sulawesi Selatan':   [{ kota:'Makassar', kodePos:'90111' },{ kota:'Parepare', kodePos:'91111' },{ kota:'Palopo', kodePos:'91911' }],
  'Sulawesi Tenggara':  [{ kota:'Kendari', kodePos:'93111' },{ kota:'Baubau', kodePos:'93711' }],
  'Maluku':             [{ kota:'Ambon', kodePos:'97211' },{ kota:'Tual', kodePos:'97611' }],
  'Maluku Utara':       [{ kota:'Sofifi', kodePos:'97791' },{ kota:'Ternate', kodePos:'97711' }],
  'Papua':              [{ kota:'Jayapura', kodePos:'99111' }],
  'Papua Barat':        [{ kota:'Manokwari', kodePos:'98311' },{ kota:'Sorong', kodePos:'98411' }],
  'Papua Selatan':      [{ kota:'Merauke', kodePos:'99611' }],
  'Papua Tengah':       [{ kota:'Nabire', kodePos:'98811' }],
  'Papua Pegunungan':   [{ kota:'Wamena', kodePos:'99511' }],
}
const PROVINSI_LIST = Object.keys(WILAYAH).sort()

const PEKERJAAN_LIST = [
  'PNS / ASN','TNI / Polri','Pegawai BUMN','Pegawai Swasta','Wiraswasta / Pengusaha',
  'Petani','Nelayan','Buruh','Guru / Dosen','Tenaga Kesehatan','Pedagang',
  'Ibu Rumah Tangga','Pelajar / Mahasiswa','Pensiunan','Lainnya',
]

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ type, msg, onClose }: { type: 'success' | 'error'; msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in text-white
      ${type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <p className="text-sm font-semibold">{msg}</p>
    </div>
  )
}

// ── Selector Anggota ──────────────────────────────────────────────────────────
function AnggotaSelector({ selected, onSelect }: {
  selected: AnggotaDetail | null
  onSelect: (a: AnggotaDetail) => void
}) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<AnggotaDetail[]>([])
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get<PaginatedResponse<AnggotaDetail>>(
          `/anggota?search=${encodeURIComponent(query)}&limit=8`
        )
        setResults(res.data)
        setShow(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-surface-300 rounded-xl focus-within:border-ink-800 transition-colors">
        <Search className="w-4 h-4 text-ink-300 shrink-0" />
        <input
          type="text"
          placeholder="Cari anggota berdasarkan nama atau no. anggota..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setShow(true) }}
          className="flex-1 text-sm outline-none bg-transparent text-ink-800 placeholder:text-ink-300"
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-ink-300 shrink-0" />}
      </div>
      {show && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-surface-200 rounded-xl shadow-xl z-30 overflow-hidden">
          {results.map(a => {
            const sc = STATUS_ANGGOTA[a.status] ?? STATUS_ANGGOTA['non-aktif']
            return (
              <button key={a.id_anggota} type="button"
                onClick={() => { onSelect(a); setQuery(''); setShow(false); setResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 text-left transition-colors border-b border-surface-100 last:border-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }} >
                    <User className="w-5 h-5 text-white" />
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-800 truncate">{a.nama_lengkap}</p>
                  <p className="text-[11px] text-ink-300 font-mono">{a.no_anggota}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Modal Update Profil ───────────────────────────────────────────────────────
function ModalUpdateProfil({ anggota, onClose, onSuccess }: {
  anggota: AnggotaDetail
  onClose: () => void
  onSuccess: () => void
}) {
  const profil = anggota.profil
  const [form, setForm] = useState({
    nik:           profil?.nik           ?? '',
    tempat_lahir:  profil?.tempat_lahir  ?? '',
    tanggal_lahir: profil?.tanggal_lahir ?? '',
    jenis_kelamin: (profil?.jenis_kelamin ?? '') as 'L' | 'P' | '',
    alamat:        profil?.alamat        ?? '',
    provinsi:      profil?.provinsi      ?? '',
    kota:          profil?.kota          ?? '',
    kode_pos:      profil?.kode_pos      ?? '',
    pekerjaan:     profil?.pekerjaan     ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  const kotaList = form.provinsi ? (WILAYAH[form.provinsi] ?? []) : []

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value
    const defaultKota = WILAYAH[prov]?.[0]
    setForm(f => ({
      ...f,
      provinsi: prov,
      kota:     defaultKota?.kota    ?? '',
      kode_pos: defaultKota?.kodePos ?? '',
    }))
  }

  const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kotaNama = e.target.value
    const found = kotaList.find(k => k.kota === kotaNama)
    setForm(f => ({
      ...f,
      kota:     kotaNama,
      kode_pos: found?.kodePos ?? f.kode_pos,
    }))
  }

  const handleSubmit = async () => {
    setErr(null); setLoading(true)
    try {
      const payload = {
        id_anggota:    anggota.id_anggota,
        nik:           form.nik           || null,
        tempat_lahir:  form.tempat_lahir  || null,
        tanggal_lahir: form.tanggal_lahir || null,
        jenis_kelamin: (form.jenis_kelamin as 'L' | 'P') || null,
        alamat:        form.alamat        || null,
        provinsi:      form.provinsi      || null,
        kota:          form.kota          || null,
        kode_pos:      form.kode_pos      || null,
        pekerjaan:     form.pekerjaan     || null,
      }
      await api.post(`/anggota/${anggota.id_anggota}/profil`, payload)
      onSuccess()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan profil')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors bg-white'
  const labelCls = 'block text-xs font-medium text-ink-600 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in" onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            <div>
              <h2 className="text-base font-semibold text-ink-800">Update Profil Anggota</h2>
              <p className="text-xs text-ink-300 mt-0.5">{anggota.nama_lengkap} · {anggota.no_anggota}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-200 flex items-center justify-center">
              <X className="w-4 h-4 text-ink-400" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {err && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{err}</p>
              </div>
            )}

            {/* Identitas */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-300 mb-3">Identitas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>NIK</label>
                  <input value={form.nik} onChange={set('nik')} maxLength={16} placeholder="16 digit NIK" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tempat Lahir</label>
                  <input value={form.tempat_lahir} onChange={set('tempat_lahir')} placeholder="Kota kelahiran" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tanggal Lahir</label>
                  <input type="date" value={form.tanggal_lahir} onChange={set('tanggal_lahir')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Jenis Kelamin</label>
                  <select value={form.jenis_kelamin} onChange={set('jenis_kelamin')} className={inputCls}>
                    <option value="">— Pilih —</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-300 mb-3">Alamat</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Alamat Lengkap</label>
                  <textarea value={form.alamat} onChange={set('alamat')} rows={2} placeholder="Jl. ..." className={inputCls + ' resize-none'} />
                </div>
                <div>
                  <label className={labelCls}>Provinsi</label>
                  <select value={form.provinsi} onChange={handleProvinsiChange} className={inputCls}>
                    <option value="">— Pilih Provinsi —</option>
                    {PROVINSI_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Kota / Kabupaten</label>
                  {kotaList.length > 0 ? (
                    <select value={form.kota} onChange={handleKotaChange} className={inputCls}>
                      <option value="">— Pilih Kota —</option>
                      {kotaList.map(k => (
                        <option key={k.kota} value={k.kota}>{k.kota}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.kota}
                      onChange={set('kota')}
                      placeholder="Pilih provinsi dulu"
                      disabled={!form.provinsi}
                      className={inputCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                    />
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Kode Pos
                    {form.kode_pos && form.kota && (
                      <span className="ml-2 text-emerald-600 font-normal">(otomatis)</span>
                    )}
                  </label>
                  <input
                    value={form.kode_pos}
                    onChange={set('kode_pos')}
                    maxLength={10}
                    placeholder="12345"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Pekerjaan */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-300 mb-3">Pekerjaan</p>
              <div>
                <label className={labelCls}>Pekerjaan</label>
                <select value={form.pekerjaan} onChange={set('pekerjaan')} className={inputCls}>
                  <option value="">— Pilih Pekerjaan —</option>
                  {PEKERJAAN_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {form.pekerjaan === 'Lainnya' && (
                  <input
                    className={inputCls + ' mt-2'}
                    placeholder="Tulis pekerjaan..."
                    onChange={e => setForm(f => ({ ...f, pekerjaan: e.target.value }))}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-surface-200">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 hover:bg-surface-200 transition-colors">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-ink-800 text-white text-sm font-semibold hover:bg-ink-700 transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab Simpanan ──────────────────────────────────────────────────────────────
function TabSimpanan({ idAnggota }: { idAnggota: number }) {
  const [list, setList]             = useState<Transaksi[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const LIMIT = 8

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<PaginatedResponse<Transaksi>>(
        `/simpanan?id_anggota=${idAnggota}&skip=${(page - 1) * LIMIT}&limit=${LIMIT}`
      )
      setList(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.total_pages)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally { setLoading(false) }
  }, [idAnggota, page])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-ink-300" /></div>
  if (error)   return <div className="flex items-center gap-2.5 p-4 m-4 rounded-xl bg-red-50 border border-red-200"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs text-red-700">{error}</p></div>
  if (!list.length) return <p className="text-center text-sm text-ink-300 py-16">Belum ada transaksi simpanan</p>

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-200">
              {['No. Transaksi','Jenis','Tipe','Nominal','Saldo Akhir','Tanggal','Keterangan'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider px-4 pb-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(t => (
              <tr key={t.id_simpanan} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 font-mono text-ink-500">{t.no_transaksi}</td>
                <td className="px-4 py-3 text-ink-600">{t.nama_jenis_simpanan ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${t.tipe_transaksi === 'setor' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipe_transaksi === 'setor' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                    {t.tipe_transaksi === 'setor' ? 'Setor' : 'Tarik'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.tipe_transaksi === 'tarik' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {t.tipe_transaksi === 'tarik' ? '−' : '+'}{fmt(t.nominal)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink-800 whitespace-nowrap">{fmt(t.saldo_akhir)}</td>
                <td className="px-4 py-3 text-ink-400 whitespace-nowrap">{t.tanggal_transaksi}</td>
                <td className="px-4 py-3 text-ink-400 max-w-[120px] truncate">{t.keterangan ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
          <p className="text-[11px] text-ink-300">{total} transaksi total</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-surface-200 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-ink-400" /></button>
            <span className="text-xs text-ink-400 px-2">Hal. {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-surface-200 disabled:opacity-40 transition-colors"><ChevronRight className="w-3.5 h-3.5 text-ink-400" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab Pinjaman ──────────────────────────────────────────────────────────────
const PINJAMAN_STATUS: Record<string, { label: string; bg: string; text: string; Icon: React.ElementType }> = {
  pending:   { label: 'Menunggu',  bg: 'bg-amber-50',   text: 'text-amber-700',   Icon: Clock       },
  disetujui: { label: 'Disetujui', bg: 'bg-blue-50',    text: 'text-blue-700',    Icon: CheckCircle },
  ditolak:   { label: 'Ditolak',   bg: 'bg-red-50',     text: 'text-red-700',     Icon: XCircle     },
  lunas:     { label: 'Lunas',     bg: 'bg-emerald-50', text: 'text-emerald-700', Icon: CreditCard  },
}

function TabPinjaman({ idAnggota }: { idAnggota: number }) {
  const [list, setList]             = useState<Pinjaman[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const LIMIT = 8

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<PaginatedResponse<Pinjaman>>(
        `/pinjaman?id_anggota=${idAnggota}&skip=${(page - 1) * LIMIT}&limit=${LIMIT}`
      )
      setList(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.total_pages)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally { setLoading(false) }
  }, [idAnggota, page])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-ink-300" /></div>
  if (error)   return <div className="flex items-center gap-2.5 p-4 m-4 rounded-xl bg-red-50 border border-red-200"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs text-red-700">{error}</p></div>
  if (!list.length) return <p className="text-center text-sm text-ink-300 py-16">Belum ada riwayat pinjaman</p>

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-200">
              {['No. Pinjaman','Keperluan','Nominal','Sisa','Status','Tanggal'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-ink-300 uppercase tracking-wider px-4 pb-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(p => {
              const sc = PINJAMAN_STATUS[p.status] ?? PINJAMAN_STATUS['pending']
              return (
                <tr key={p.id_pinjaman} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-ink-500">{p.no_pinjaman}</td>
                  <td className="px-4 py-3 text-ink-600 max-w-[140px] truncate">{p.keperluan ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-800 whitespace-nowrap">{fmt(p.nominal_pinjaman)}</td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${p.sisa_pinjaman > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {fmt(p.sisa_pinjaman)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                      <sc.Icon className="w-3 h-3" />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-400 whitespace-nowrap">{p.tanggal_pengajuan}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
          <p className="text-[11px] text-ink-300">{total} pinjaman total</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-surface-200 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-ink-400" /></button>
            <span className="text-xs text-ink-400 px-2">Hal. {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-surface-200 disabled:opacity-40 transition-colors"><ChevronRight className="w-3.5 h-3.5 text-ink-400" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilAnggotaPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'bendahara'

  const [anggota, setAnggota]     = useState<AnggotaDetail | null>(null)
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'simpanan' | 'pinjaman'>('simpanan')
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadDetail = useCallback(async (idAnggota: number) => {
    setLoading(true)
    try {
      const detail = await api.get<AnggotaDetail>(`/anggota/${idAnggota}/detail`)
      setAnggota(detail)
    } catch (e: unknown) {
      setToast({ type: 'error', msg: e instanceof Error ? e.message : 'Gagal memuat detail' })
    } finally { setLoading(false) }
  }, [])

  const handleSelect    = (a: AnggotaDetail) => loadDetail(a.id_anggota)
  const handleProfilSaved = async () => {
    setShowModal(false)
    setToast({ type: 'success', msg: 'Profil berhasil diperbarui' })
    if (anggota) await loadDetail(anggota.id_anggota)
  }

  const profil = anggota?.profil
  const sc     = anggota ? (STATUS_ANGGOTA[anggota.status] ?? STATUS_ANGGOTA['non-aktif']) : null

  const infoBlocks = anggota ? [
    { icon: BadgeCheck, label: 'No. Anggota',   val: anggota.no_anggota,        col: 'text-ink-800 font-mono' },
    { icon: User,       label: 'Nama Lengkap',  val: anggota.nama_lengkap,      col: 'text-ink-800' },
    { icon: Phone,      label: 'No. HP',        val: anggota.no_telepon ?? '—', col: 'text-ink-700' },
    { icon: Mail,       label: 'Email',         val: anggota.email ?? '—',      col: 'text-ink-700' },
    { icon: MapPin,     label: 'Alamat',        val: [profil?.alamat, profil?.kota, profil?.provinsi].filter(Boolean).join(', ') || '—', col: 'text-ink-700' },
    { icon: Calendar,  label: 'Tgl. Bergabung', val: anggota.tanggal_bergabung, col: 'text-ink-700' },
  ] : []

  const profilBlocks = anggota ? [
    { icon: BadgeCheck, label: 'NIK',          val: profil?.nik ?? '—' },
    { icon: Calendar,   label: 'Tgl. Lahir',   val: profil?.tanggal_lahir ? `${profil.tempat_lahir ?? ''}, ${profil.tanggal_lahir}` : '—' },
    { icon: User,       label: 'Jenis Kelamin',val: profil?.jenis_kelamin === 'L' ? 'Laki-laki' : profil?.jenis_kelamin === 'P' ? 'Perempuan' : '—' },
    { icon: Briefcase,  label: 'Pekerjaan',    val: profil?.pekerjaan ?? '—' },
  ] : []

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
      {showModal && anggota && (
        <ModalUpdateProfil anggota={anggota} onClose={() => setShowModal(false)} onSuccess={handleProfilSaved} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Detail Profil Anggota</h1>
          <p className="text-xs text-ink-300 mt-0.5">Lihat dan perbarui data lengkap anggota koperasi</p>
        </div>
        {anggota && canEdit && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink-800 text-white text-sm font-semibold hover:bg-ink-700 transition-colors shrink-0">
            <Edit3 className="w-4 h-4" /> Update Profil
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <p className="text-xs font-medium text-ink-600 mb-2">Pilih Anggota</p>
        <AnggotaSelector selected={anggota} onSelect={handleSelect} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !anggota && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-ink-300" />
          </div>
          <p className="text-sm text-ink-400">Pilih anggota untuk melihat profil lengkap</p>
        </div>
      )}

      {/* Content */}
      {!loading && anggota && sc && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide">Total Simpanan</p>
              </div>
              <p className="text-base font-bold text-ink-800">{fmt(anggota.total_simpanan ?? 0)}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide">Pinjaman Aktif</p>
              </div>
              <p className="text-base font-bold text-ink-800">{fmt(anggota.total_pinjaman_aktif ?? 0)}</p>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Kolom kiri — 1 card: info utama + tambahan */}
            <div className="card lg:col-span-1 space-y-0">

              {/* Avatar header */}
              <div className="flex items-center gap-3 pb-4 mb-2 border-b border-surface-100">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800 truncate">{anggota.nama_lengkap}</p>
                  <p className="text-[11px] text-ink-300 font-mono">{anggota.no_anggota}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                </div>
              </div>

              {/* Informasi Utama */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300 pb-1">Informasi Utama</p>
              {infoBlocks.map(({ icon: Icon, label, val, col }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-surface-100 last:border-0">
                  <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-ink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-ink-300 font-medium">{label}</p>
                    <p className={`text-xs font-medium mt-0.5 truncate ${col}`}>{val}</p>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="pt-3 mt-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300 pb-1">Informasi Tambahan</p>
                {profilBlocks.map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-surface-100 last:border-0">
                    <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-ink-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-ink-300 font-medium">{label}</p>
                      <p className="text-xs text-ink-800 font-medium mt-0.5 truncate">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {canEdit && (
                <button onClick={() => setShowModal(true)}
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-400 hover:text-ink-800 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Lengkapi / Edit Profil
                </button>
              )}
            </div>

            {/* Kolom kanan — Tab Riwayat */}
            <div className="lg:col-span-2">
              <div className="card p-0 overflow-hidden">
                <div className="flex border-b border-surface-200 px-4 pt-4">
                  {[
                    { key: 'simpanan' as const, label: 'Riwayat Simpanan', Icon: Wallet },
                    { key: 'pinjaman' as const, label: 'Riwayat Pinjaman', Icon: CreditCard },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                        activeTab === tab.key ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
                      }`}>
                      <tab.Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                  <button onClick={() => loadDetail(anggota.id_anggota)} title="Refresh"
                    className="ml-auto mb-2 p-2 rounded-lg hover:bg-surface-200 transition-colors self-start">
                    <RefreshCw className="w-3.5 h-3.5 text-ink-400" />
                  </button>
                </div>
                {activeTab === 'simpanan'
                  ? <TabSimpanan idAnggota={anggota.id_anggota} />
                  : <TabPinjaman idAnggota={anggota.id_anggota} />
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}