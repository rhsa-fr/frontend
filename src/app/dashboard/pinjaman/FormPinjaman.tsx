'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X, Calculator, Upload, CheckCircle2, AlertCircle,
  FileText, Loader2, ChevronDown, User
} from 'lucide-react'
import {
  Pinjaman, PinjamanCreatePayload, Anggota, SyaratItem,
  getSyaratByNominal, hitungPinjaman, formatRupiah
} from './types'
import { api } from '@/lib/axios'

interface Props {
  onClose: () => void
  onSuccess: (pinjaman: Pinjaman) => void
}

const NOMINAL_PRESETS = [
  { label: '1 Jt',  value: 1_000_000  },
  { label: '2 Jt',  value: 2_000_000  },
  { label: '5 Jt',  value: 5_000_000  },
  { label: '10 Jt', value: 10_000_000 },
  { label: '15 Jt', value: 15_000_000 },
  { label: '20 Jt', value: 20_000_000 },
  { label: '25 Jt', value: 25_000_000 },
  { label: '50 Jt', value: 50_000_000 },
]

function toDisplayValue(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

function parseDisplayValue(display: string): number {
  return Number(display.replace(/\./g, ''))
}

export default function FormPinjaman({ onClose, onSuccess }: Props) {
  const [idAnggota, setIdAnggota] = useState<number | ''>('')
  const [anggotaQuery, setAnggotaQuery] = useState('')
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [anggotaDropdown, setAnggotaDropdown] = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)

  const [nominalDisplay, setNominalDisplay] = useState('')
  const nominal = nominalDisplay ? parseDisplayValue(nominalDisplay) : 0

  const [bunga, setBunga] = useState<number>(2)
  const [lama, setLama] = useState<number>(12)
  const [keperluan, setKeperluan] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [kalkulasi, setKalkulasi] = useState({ totalBunga: 0, totalPinjaman: 0, nominalAngsuran: 0 })
  const [syaratList, setSyaratList] = useState<SyaratItem[]>([])
  const [uploads, setUploads] = useState<Record<string, File | null>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const search = anggotaQuery.trim()
    if (!search) { setAnggotaList([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ data: Anggota[] }>(`/anggota?search=${encodeURIComponent(search)}&status=aktif&limit=8`)
        setAnggotaList(res.data)
      } catch { setAnggotaList([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [anggotaQuery])

  useEffect(() => {
    if (nominal > 0 && bunga >= 0 && lama > 0) {
      setKalkulasi(hitungPinjaman(nominal, bunga, lama))
    } else {
      setKalkulasi({ totalBunga: 0, totalPinjaman: 0, nominalAngsuran: 0 })
    }
  }, [nominal, bunga, lama])

  useEffect(() => {
    if (nominal > 0) {
      const syarat = getSyaratByNominal(nominal)
      setSyaratList(syarat)
      const valid = new Set(syarat.map((s) => s.kode))
      setUploads((prev) => {
        const next: Record<string, File | null> = {}
        valid.forEach((k) => { next[k] = prev[k] ?? null })
        return next
      })
    } else {
      setSyaratList([])
      setUploads({})
    }
  }, [nominal])

  const handleNominalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '')
    if (raw === '') { setNominalDisplay(''); return }
    if (!/^\d+$/.test(raw)) return
    setNominalDisplay(toDisplayValue(raw))
  }

  const handlePreset = (value: number) => {
    setNominalDisplay(value.toLocaleString('id-ID'))
  }

  const handleFileChange = (kode: string, file: File | null) => {
    setUploads((prev) => ({ ...prev, [kode]: file }))
  }

  const handleSubmit = async () => {
    setError(null)
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu'); return }
    if (!nominal || nominal <= 0) { setError('Masukkan nominal pinjaman yang valid'); return }
    if (!keperluan.trim()) { setError('Keperluan pinjaman harus diisi'); return }

    const wajibBelumUpload = syaratList.filter((s) => s.is_wajib && !uploads[s.kode])
    if (wajibBelumUpload.length > 0) {
      setError(`Dokumen wajib belum diupload: ${wajibBelumUpload.map((s) => s.nama).join(', ')}`)
      return
    }

    setLoading(true)
    try {
      // Step 1: Buat pinjaman
      const payload: PinjamanCreatePayload = {
        id_anggota: selectedAnggota.id_anggota,
        tanggal_pengajuan: tanggal,
        nominal_pinjaman: nominal,
        bunga_persen: bunga,
        lama_angsuran: lama,
        keperluan,
      }
      const result = await api.post<Pinjaman>('/pinjaman', payload)

      // Step 2: Upload dokumen jika ada file yang dipilih
      const hasUploads = Object.values(uploads).some(f => f !== null)
      if (hasUploads) {
        try {
          // Fetch checklist — backend sudah generate pinjaman_syarat rows
          const checklist = await api.get<{
            detail_syarat: Array<{
              id_pinjaman_syarat: number
              syarat: { kode_syarat: string } | null
            }>
          }>(`/syarat-peminjaman/pinjaman/${result.id_pinjaman}/checklist`)

          const token = localStorage.getItem('token')
          await Promise.allSettled(
            checklist.detail_syarat
              .filter(d => d.syarat?.kode_syarat && uploads[d.syarat.kode_syarat])
              .map(d => {
                const file = uploads[d.syarat!.kode_syarat]!
                const form = new FormData()
                form.append('file', file)
                return fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/syarat-peminjaman/pinjaman-syarat/${d.id_pinjaman_syarat}/upload`,
                  {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: form,
                  }
                )
              })
          )
        } catch {
          // Upload gagal tidak membatalkan pengajuan
        }
      }

      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pengajuan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">

        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-ink-800">Pengajuan Pinjaman Baru</h2>
            <p className="text-xs text-ink-300 mt-0.5">Isi formulir pengajuan pinjaman anggota</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Data Anggota */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">Data Anggota</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 relative">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Cari Anggota <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="text"
                    placeholder="Ketik nama atau nomor anggota..."
                    value={selectedAnggota ? `${selectedAnggota.no_anggota} — ${selectedAnggota.nama_lengkap}` : anggotaQuery}
                    onChange={(e) => { setAnggotaQuery(e.target.value); setSelectedAnggota(null); setAnggotaDropdown(true) }}
                    onFocus={() => setAnggotaDropdown(true)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                  />
                  {selectedAnggota && (
                    <button onClick={() => { setSelectedAnggota(null); setAnggotaQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-ink-300 hover:text-ink-600" />
                    </button>
                  )}
                </div>
                {anggotaDropdown && anggotaList.length > 0 && !selectedAnggota && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-300 rounded-xl shadow-lg z-20 overflow-hidden">
                    {anggotaList.map((a) => (
                      <button key={a.id_anggota}
                        onClick={() => { setSelectedAnggota(a); setIdAnggota(a.id_anggota); setAnggotaDropdown(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-100 text-left transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-ink-800 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{a.nama_lengkap.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink-800">{a.nama_lengkap}</p>
                          <p className="text-[10px] text-ink-300">{a.no_anggota}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Tanggal Pengajuan</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Keperluan <span className="text-red-500">*</span></label>
                <input type="text" placeholder="cth: Modal usaha" value={keperluan} onChange={(e) => setKeperluan(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors" />
              </div>
            </div>
          </section>

          {/* Detail Pinjaman */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">Detail Pinjaman</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 space-y-2">
                <label className="block text-xs font-medium text-ink-600">Nominal Pinjaman <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {NOMINAL_PRESETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => handlePreset(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        nominal === p.value
                          ? 'bg-ink-800 text-white border-ink-800'
                          : 'bg-white text-ink-600 border-surface-300 hover:border-ink-800 hover:text-ink-800'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400 font-semibold select-none">Rp</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={nominalDisplay} onChange={handleNominalInput}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors tracking-wide" />
                  {nominalDisplay && (
                    <button type="button" onClick={() => setNominalDisplay('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-ink-300 hover:text-ink-600" />
                    </button>
                  )}
                </div>
                {nominal > 0 && (
                  <p className="text-[11px] text-ink-400 pl-1">= <span className="font-semibold text-ink-600">{formatRupiah(nominal)}</span></p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Bunga (%/bln)</label>
                <input type="number" min={0} max={100} step={0.5} value={bunga}
                  onChange={(e) => setBunga(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Lama Angsuran</label>
                <div className="relative">
                  <select value={lama} onChange={(e) => setLama(Number(e.target.value))}
                    className="w-full appearance-none px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 bg-white pr-8 transition-colors">
                    {[3, 6, 12, 18, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={m}>{m} bulan</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300 pointer-events-none" />
                </div>
              </div>
            </div>

            {nominal > 0 && (
              <div className="mt-3 p-4 rounded-xl bg-ink-800 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-ink-200" />
                  <p className="text-xs font-semibold tracking-wide">Hasil Kalkulasi Otomatis</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Bunga',    val: formatRupiah(kalkulasi.totalBunga) },
                    { label: 'Total Pinjaman', val: formatRupiah(kalkulasi.totalPinjaman) },
                    { label: 'Angsuran/Bulan', val: formatRupiah(kalkulasi.nominalAngsuran) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-ink-300 font-medium">{item.label}</p>
                      <p className="text-sm font-bold mt-0.5">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Dokumen Persyaratan */}
          {syaratList.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300">Dokumen Persyaratan</h3>
                <span className="text-[10px] text-ink-300">
                  {Object.values(uploads).filter(Boolean).length}/{syaratList.length} diupload
                </span>
              </div>
              <div className="space-y-2">
                {syaratList.map((s) => {
                  const uploaded = !!uploads[s.kode]
                  return (
                    <div key={s.kode}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        uploaded ? 'border-emerald-200 bg-emerald-50' : 'border-surface-200 bg-surface-50'
                      }`}>
                      {uploaded
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <FileText className={`w-4 h-4 shrink-0 ${s.is_wajib ? 'text-red-400' : 'text-ink-300'}`} />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-ink-800">{s.nama}</p>
                          {s.is_wajib
                            ? <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">WAJIB</span>
                            : <span className="text-[9px] bg-surface-200 text-ink-400 px-1.5 py-0.5 rounded-full font-semibold">OPSIONAL</span>
                          }
                        </div>
                        {uploaded && <p className="text-[10px] text-emerald-600 mt-0.5 truncate">{uploads[s.kode]?.name}</p>}
                      </div>
                      <div>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                          ref={(el) => { fileRefs.current[s.kode] = el }}
                          onChange={(e) => handleFileChange(s.kode, e.target.files?.[0] ?? null)}
                          className="hidden" />
                        <button onClick={() => fileRefs.current[s.kode]?.click()}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                            uploaded
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-ink-800 text-white hover:bg-ink-700'
                          }`}>
                          <Upload className="w-3 h-3" />
                          {uploaded ? 'Ganti' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-surface-200 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 hover:bg-surface-200 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-ink-800 text-white text-sm font-semibold hover:bg-ink-700 transition-colors disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Menyimpan...' : 'Ajukan Pinjaman'}
          </button>
        </div>
      </div>
    </div>
  )
}