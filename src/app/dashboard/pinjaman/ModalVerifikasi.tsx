'use client'

import { useState, useEffect } from 'react'
import {
  X, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Calendar, FileText, Eye, Download, ShieldCheck, ShieldX
} from 'lucide-react'
import { Pinjaman, PinjamanApprovePayload, PinjamanRejectPayload, formatRupiah } from './types'
import { api } from '@/lib/axios'

// ============================================================================
// Types
// ============================================================================

interface SyaratDetail {
  id_pinjaman_syarat: number
  id_syarat: number
  is_terpenuhi: boolean
  dokumen_path: string | null
  catatan: string | null
  nama_syarat: string | null
  deskripsi_syarat: string | null
  dokumen_diperlukan: string | null
  syarat?: {
    is_wajib: boolean
    nama_syarat: string
  }
}

interface ChecklistResponse {
  total_syarat: number
  syarat_terpenuhi: number
  syarat_belum_terpenuhi: number
  persentase_kelengkapan: number
  semua_syarat_wajib_terpenuhi: boolean
  detail_syarat: SyaratDetail[]
}

interface Props {
  pinjaman: Pinjaman
  onClose: () => void
  onSuccess: (updated: Pinjaman) => void
}

// ============================================================================
// ModalVerifikasi
// ============================================================================

export default function ModalVerifikasi({ pinjaman, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'idle' | 'setuju' | 'tolak'>('idle')
  const [catatan, setCatatan] = useState('')
  const [tanggalPersetujuan, setTanggalPersetujuan] = useState(new Date().toISOString().split('T')[0])
  const [tanggalPencairan, setTanggalPencairan] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dokumen / checklist
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null)
  const [loadingChecklist, setLoadingChecklist] = useState(true)
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'dokumen'>('ringkasan')

  // Fetch checklist dokumen saat modal dibuka
  useEffect(() => {
    setLoadingChecklist(true)
    api.get<ChecklistResponse>(`/syarat-peminjaman/pinjaman/${pinjaman.id_pinjaman}/checklist`)
      .then(setChecklist)
      .catch(() => setChecklist(null))
      .finally(() => setLoadingChecklist(false))
  }, [pinjaman.id_pinjaman])

  const handleApprove = async () => {
    setError(null)
    setLoading(true)
    try {
      const payload: PinjamanApprovePayload = {
        tanggal_persetujuan: tanggalPersetujuan,
        tanggal_pencairan: tanggalPencairan,
        catatan_persetujuan: catatan,
      }
      const result = await api.put<Pinjaman>(`/pinjaman/${pinjaman.id_pinjaman}/approve`, payload)
      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyetujui pinjaman')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!catatan.trim()) { setError('Catatan penolakan wajib diisi'); return }
    setError(null)
    setLoading(true)
    try {
      const payload: PinjamanRejectPayload = { catatan_persetujuan: catatan }
      const result = await api.put<Pinjaman>(`/pinjaman/${pinjaman.id_pinjaman}/reject`, payload)
      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menolak pinjaman')
    } finally {
      setLoading(false)
    }
  }

  const persen = checklist
    ? Math.round(checklist.persentase_kelengkapan)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink-800">Verifikasi Pinjaman</h2>
            <p className="text-xs text-ink-300 mt-0.5">{pinjaman.no_pinjaman}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(['ringkasan', 'dokumen'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-ink-800 text-white'
                  : 'text-ink-500 hover:bg-surface-100'
              }`}
            >
              {tab === 'dokumen' && (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  checklist?.semua_syarat_wajib_terpenuhi
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {checklist?.syarat_terpenuhi ?? 0}
                </span>
              )}
              {tab === 'ringkasan' ? 'Ringkasan' : 'Dokumen'}
            </button>
          ))}
        </div>

        {/* ── Body scrollable ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* ── TAB: RINGKASAN ── */}
          {activeTab === 'ringkasan' && (
            <>
              {/* Info Anggota & Pinjaman */}
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {pinjaman.nama_anggota?.slice(0, 2).toUpperCase() ?? 'AN'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{pinjaman.nama_anggota}</p>
                    <p className="text-xs text-ink-400">{pinjaman.keperluan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-200">
                  {[
                    { label: 'Nominal Pinjaman', val: formatRupiah(pinjaman.nominal_pinjaman) },
                    { label: 'Total + Bunga',    val: formatRupiah(pinjaman.total_pinjaman) },
                    { label: 'Angsuran/Bulan',   val: formatRupiah(pinjaman.nominal_angsuran) },
                    { label: 'Lama Angsuran',    val: `${pinjaman.lama_angsuran} bulan` },
                    { label: 'Bunga',            val: `${pinjaman.bunga_persen}% / bulan` },
                    { label: 'Tgl. Pengajuan',   val: pinjaman.tanggal_pengajuan },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[10px] text-ink-300">{item.label}</p>
                      <p className="text-xs font-semibold text-ink-800">{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Progress kelengkapan dokumen */}
                {checklist && (
                  <div className="pt-3 border-t border-surface-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] text-ink-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Kelengkapan Dokumen
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-semibold text-ink-600">
                          {checklist.syarat_terpenuhi}/{checklist.total_syarat}
                        </p>
                        {checklist.semua_syarat_wajib_terpenuhi
                          ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          : <ShieldX className="w-3.5 h-3.5 text-red-400" />
                        }
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          checklist.semua_syarat_wajib_terpenuhi ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                    {!checklist.semua_syarat_wajib_terpenuhi && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        Ada syarat wajib yang belum terpenuhi. Lihat tab Dokumen.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Mode: idle */}
              {mode === 'idle' && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMode('setuju')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition-all group">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-semibold text-emerald-700">Setujui</p>
                    <p className="text-[10px] text-emerald-500 text-center">Pinjaman disetujui dan jadwal angsuran dibuat</p>
                  </button>
                  <button onClick={() => setMode('tolak')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100 transition-all group">
                    <XCircle className="w-7 h-7 text-red-400 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-semibold text-red-600">Tolak</p>
                    <p className="text-[10px] text-red-400 text-center">Pengajuan ditolak disertai alasan penolakan</p>
                  </button>
                </div>
              )}

              {/* Mode: setuju */}
              {mode === 'setuju' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-700">Menyetujui Pengajuan Pinjaman</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Tgl. Persetujuan
                      </label>
                      <input type="date" value={tanggalPersetujuan} onChange={e => setTanggalPersetujuan(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Tgl. Pencairan
                      </label>
                      <input type="date" value={tanggalPencairan} onChange={e => setTanggalPencairan(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">Catatan (opsional)</label>
                    <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)}
                      placeholder="Tambahkan catatan persetujuan..."
                      className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMode('idle')}
                      className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors">
                      Kembali
                    </button>
                    <button onClick={handleApprove} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {loading ? 'Memproses...' : 'Konfirmasi Setuju'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: tolak */}
              {mode === 'tolak' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs font-semibold text-red-700">Menolak Pengajuan Pinjaman</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">
                      Alasan Penolakan <span className="text-red-500">*</span>
                    </label>
                    <textarea rows={4} value={catatan} onChange={e => setCatatan(e.target.value)}
                      placeholder="Tuliskan alasan penolakan secara jelas..."
                      className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-red-400 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMode('idle')}
                      className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors">
                      Kembali
                    </button>
                    <button onClick={handleReject} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {loading ? 'Memproses...' : 'Konfirmasi Tolak'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TAB: DOKUMEN ── */}
          {activeTab === 'dokumen' && (
            <div className="space-y-3">
              {loadingChecklist ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
                </div>
              ) : !checklist || checklist.detail_syarat.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-8 h-8 text-ink-200 mb-2" />
                  <p className="text-sm text-ink-400">Tidak ada dokumen persyaratan</p>
                  <p className="text-xs text-ink-300 mt-1">Pengajuan ini tidak memerlukan dokumen syarat</p>
                </div>
              ) : (
                <>
                  {/* Summary badge */}
                  <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                    checklist.semua_syarat_wajib_terpenuhi
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    {checklist.semua_syarat_wajib_terpenuhi
                      ? <ShieldCheck className="w-4 h-4 shrink-0" />
                      : <ShieldX className="w-4 h-4 shrink-0" />
                    }
                    {checklist.semua_syarat_wajib_terpenuhi
                      ? 'Semua syarat wajib terpenuhi — pinjaman dapat disetujui'
                      : `${checklist.syarat_belum_terpenuhi} syarat belum terpenuhi`
                    }
                  </div>

                  {/* List dokumen */}
                  {checklist.detail_syarat.map(d => {
                    const isWajib = d.syarat?.is_wajib ?? false
                    const namaDoc = d.nama_syarat ?? d.syarat?.nama_syarat ?? 'Dokumen'
                    const hasFile = !!d.dokumen_path

                    return (
                      <div key={d.id_pinjaman_syarat}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                          d.is_terpenuhi
                            ? 'border-emerald-100 bg-emerald-50'
                            : isWajib
                            ? 'border-red-100 bg-red-50'
                            : 'border-surface-200 bg-surface-50'
                        }`}>
                        {/* Status icon */}
                        <div className="shrink-0">
                          {d.is_terpenuhi
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            : <XCircle className={`w-5 h-5 ${isWajib ? 'text-red-400' : 'text-ink-300'}`} />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink-800">{namaDoc}</p>
                            {isWajib
                              ? <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">WAJIB</span>
                              : <span className="text-[9px] bg-surface-200 text-ink-400 px-1.5 py-0.5 rounded-full font-bold">OPSIONAL</span>
                            }
                          </div>
                          {d.deskripsi_syarat && (
                            <p className="text-xs text-ink-400 mt-0.5">{d.deskripsi_syarat}</p>
                          )}
                          {d.catatan && (
                            <p className="text-xs text-ink-500 mt-0.5 italic">Catatan: {d.catatan}</p>
                          )}
                          {!hasFile && !d.is_terpenuhi && (
                            <p className="text-xs text-ink-300 mt-0.5">Belum diupload</p>
                          )}
                        </div>

                        {/* Tombol lihat/download dokumen */}
                        {hasFile && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}/${d.dokumen_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-3 h-3" /> Lihat
                            </a>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}/${d.dokumen_path}`}
                              download
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-surface-100 text-ink-600 border border-surface-200 hover:bg-surface-200 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer — hanya tampil di tab ringkasan mode idle ── */}
        {activeTab === 'ringkasan' && mode === 'idle' && (
          <div className="px-6 py-3 border-t border-surface-100 shrink-0">
            <p className="text-[10px] text-ink-300 text-center">
              Pilih Setujui atau Tolak di atas untuk memberi keputusan
            </p>
          </div>
        )}
      </div>
    </div>
  )
}