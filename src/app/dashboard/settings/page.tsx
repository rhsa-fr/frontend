'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Settings, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Setting {
  id_setting: number
  nama_koperasi: string
  deskripsi?: string
  alamat?: string
  no_telepon?: string
  email?: string
  bunga_default: number
  denda_keterlambatan: number
  min_nominal_pinjaman: number
  max_nominal_pinjaman?: number
  max_lama_angsuran: number
  saldo_minimal_simpanan: number
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [setting, setSetting] = useState<Setting | null>(null)
  const [form, setForm] = useState<Partial<Setting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = user?.role === 'admin'

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)

    return () => clearTimeout(timer)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const fetchSetting = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Setting>('/setting')
      setSetting(data)
      setForm(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat setting')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSetting()
  }, [fetchSetting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      addToast('Hanya admin yang dapat mengubah setting', 'error')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await api.put<Setting>('/setting', form)
      setSetting(updated)
      // Delay sedikit sebelum scroll agar notifikasi render lebih dulu
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      addToast('Pengaturan berhasil disimpan! ✓', 'success')
      
      // Refresh halaman setelah 2 detik agar perubahan muncul di semua halaman
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan setting'
      setError(errorMsg)
      addToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-ink-400" />
      </div>
    )
  }

  return (
    <>
      {/* Toast Notifications via Portal - Modal Dialog Style */}
      {mounted && createPortal(
        <>
          {/* Backdrop */}
          {toasts.length > 0 && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          )}

          {/* Modals */}
          {toasts.map(toast => (
            <div key={toast.id} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-300">
                {/* Icon + Title Row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    toast.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
                  )}>
                    {toast.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-sm font-bold",
                      toast.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                    )}>
                      {toast.type === 'success' ? 'Berhasil' : 'Kesalahan'}
                    </h3>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {toast.type === 'success' ? 'Perubahan disimpan' : 'Terjadi kesalahan'}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm text-ink-600 mb-5">
                  {toast.message}
                </p>

                {/* Close Button */}
                <div className="flex gap-2">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-1 h-9 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: toast.type === 'success' 
                        ? 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' 
                        : 'linear-gradient(135deg, #dc2626, #991b1b)',
                      color: 'white'
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>,
        document.body
      )}

      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-800">Pengaturan Koperasi</h1>
          <p className="text-sm text-ink-400 mt-1">Kelola konfigurasi sistem koperasi</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Koperasi */}
        <div className="bg-white rounded-2xl border border-surface-300 shadow-card p-6">
          <h2 className="text-lg font-bold text-ink-800 mb-5">Informasi Koperasi</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Koperasi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Nama Koperasi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nama_koperasi ?? ''}
                onChange={e => setForm({ ...form, nama_koperasi: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Deskripsi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-2">Deskripsi</label>
              <textarea
                value={form.deskripsi ?? ''}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                disabled={!isAdmin}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400 resize-none"
              />
            </div>

            {/* Alamat */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-2">Alamat</label>
              <input
                type="text"
                value={form.alamat ?? ''}
                onChange={e => setForm({ ...form, alamat: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* No Telepon */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">No. Telepon</label>
              <input
                type="text"
                value={form.no_telepon ?? ''}
                onChange={e => setForm({ ...form, no_telepon: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Pinjaman */}
        <div className="bg-white rounded-2xl border border-surface-300 shadow-card p-6">
          <h2 className="text-lg font-bold text-ink-800 mb-5">Pengaturan Pinjaman</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bunga Default */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Bunga Default (%) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.bunga_default ?? ''}
                onChange={e => setForm({ ...form, bunga_default: e.target.value ? parseFloat(e.target.value) : 0 })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Denda Keterlambatan */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Denda Keterlambatan (%) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.denda_keterlambatan ?? ''}
                onChange={e => setForm({ ...form, denda_keterlambatan: e.target.value ? parseFloat(e.target.value) : 0 })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Min Nominal Pinjaman */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Minimal Pinjaman (Rp) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={form.min_nominal_pinjaman ?? ''}
                onChange={e => setForm({ ...form, min_nominal_pinjaman: e.target.value ? parseFloat(e.target.value) : 0 })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Max Nominal Pinjaman */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Maksimal Pinjaman (Rp)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={form.max_nominal_pinjaman ?? ''}
                onChange={e => setForm({ ...form, max_nominal_pinjaman: e.target.value ? parseFloat(e.target.value) : undefined })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>

            {/* Max Lama Angsuran */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Maksimal Lama Angsuran (bulan) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={form.max_lama_angsuran ?? ''}
                onChange={e => setForm({ ...form, max_lama_angsuran: e.target.value ? parseInt(e.target.value) : 0 })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Simpanan */}
        <div className="bg-white rounded-2xl border border-surface-300 shadow-card p-6">
          <h2 className="text-lg font-bold text-ink-800 mb-5">Pengaturan Simpanan</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Saldo Minimal */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Saldo Minimal Simpanan (Rp) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={form.saldo_minimal_simpanan ?? ''}
                onChange={e => setForm({ ...form, saldo_minimal_simpanan: e.target.value ? parseFloat(e.target.value) : 0 })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           bg-white outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           transition-all disabled:bg-surface-50 disabled:text-ink-400"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2
                         transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              {saving ? <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </> : <>
                <CheckCircle2 className="w-4 h-4" />
                Simpan Pengaturan
              </>}
            </button>
            <button
              type="button"
              onClick={() => { setForm(setting || {}); setError(null) }}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-surface-300
                         text-ink-600 hover:bg-surface-100 transition-all disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              ℹ️ Hanya admin yang dapat mengubah pengaturan koperasi
            </p>
          </div>
        )}
      </form>
      </div>
    </>
  )
}
