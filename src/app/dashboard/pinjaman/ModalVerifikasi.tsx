'use client'

import { useState } from 'react'
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2, Calendar, FileText } from 'lucide-react'
import { Pinjaman, PinjamanApprovePayload, PinjamanRejectPayload, formatRupiah } from './types'
import { api } from '@/lib/axios'

interface Props {
  pinjaman: Pinjaman
  onClose: () => void
  onSuccess: (updated: Pinjaman) => void
}

export default function ModalVerifikasi({ pinjaman, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'idle' | 'setuju' | 'tolak'>('idle')
  const [catatan, setCatatan] = useState('')
  const [tanggalPersetujuan, setTanggalPersetujuan] = useState(new Date().toISOString().split('T')[0])
  const [tanggalPencairan, setTanggalPencairan] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div>
            <h2 className="text-base font-semibold text-ink-800">Verifikasi Pinjaman</h2>
            <p className="text-xs text-ink-300 mt-0.5">{pinjaman.no_pinjaman}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Ringkasan Pinjaman */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-ink-800 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">
                  {pinjaman.nama_anggota?.slice(0,2).toUpperCase() ?? 'AN'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">{pinjaman.nama_anggota}</p>
                <p className="text-[10px] text-ink-300">{pinjaman.keperluan}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-200">
              {[
                { label: 'Nominal Pinjaman', val: formatRupiah(pinjaman.nominal_pinjaman) },
                { label: 'Total + Bunga', val: formatRupiah(pinjaman.total_pinjaman) },
                { label: 'Angsuran/Bulan', val: formatRupiah(pinjaman.nominal_angsuran) },
                { label: 'Lama Angsuran', val: `${pinjaman.lama_angsuran} bulan` },
                { label: 'Bunga', val: `${pinjaman.bunga_persen}% / bulan` },
                { label: 'Tgl. Pengajuan', val: pinjaman.tanggal_pengajuan },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-ink-300">{item.label}</p>
                  <p className="text-xs font-semibold text-ink-800">{item.val}</p>
                </div>
              ))}
            </div>
            {/* Progress syarat */}
            {pinjaman.total_syarat !== undefined && pinjaman.total_syarat > 0 && (
              <div className="pt-2 border-t border-surface-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-ink-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Kelengkapan Dokumen
                  </p>
                  <p className="text-[10px] font-semibold text-ink-600">
                    {pinjaman.syarat_terpenuhi}/{pinjaman.total_syarat}
                  </p>
                </div>
                <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ink-800 rounded-full transition-all"
                    style={{ width: `${((pinjaman.syarat_terpenuhi ?? 0) / pinjaman.total_syarat) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Mode: idle — pilih aksi */}
          {mode === 'idle' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('setuju')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 
                           hover:border-emerald-400 hover:bg-emerald-100 transition-all group"
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-emerald-700">Setujui</p>
                <p className="text-[10px] text-emerald-500 text-center">Pinjaman disetujui dan jadwal angsuran dibuat</p>
              </button>
              <button
                onClick={() => setMode('tolak')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-200 bg-red-50 
                           hover:border-red-400 hover:bg-red-100 transition-all group"
              >
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
                  <input type="date" value={tanggalPersetujuan} onChange={(e) => setTanggalPersetujuan(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tgl. Pencairan
                  </label>
                  <input type="date" value={tanggalPencairan} onChange={(e) => setTanggalPencairan(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Catatan (opsional)</label>
                <textarea rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan persetujuan..."
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMode('idle')} className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors">
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
                <textarea rows={4} value={catatan} onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas..."
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-red-400 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMode('idle')} className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors">
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
        </div>
      </div>
    </div>
  )
}