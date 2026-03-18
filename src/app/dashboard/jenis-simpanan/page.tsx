'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X,
  CheckCircle2, XCircle, Loader2, AlertCircle, Wallet,
  BadgeCheck, Info, RefreshCw, ShieldAlert, Tag,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────────────────────────────
interface JenisSimpanan {
  id_jenis_simpanan: number
  kode_jenis: string
  nama_jenis: string
  deskripsi?: string
  is_wajib: boolean
  nominal_tetap: number
  is_active: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const EMPTY_FORM = {
  kode_jenis: '',
  nama_jenis: '',
  deskripsi: '',
  is_wajib: false,
  nominal_tetap: 0,
}


// ── Konfirmasi Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({
  title, message, confirmLabel, confirmCls, onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string
  confirmCls: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-800">{title}</h3>
            <p className="text-xs text-ink-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 border border-surface-300 hover:bg-surface-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmCls}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Form Tambah / Edit ──────────────────────────────────────────────────
function ModalForm({
  initial,
  onClose,
  onSuccess,
}: {
  initial: JenisSimpanan | null
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const isEdit = initial !== null
  const [form, setForm] = useState(
    isEdit
      ? {
          kode_jenis: initial.kode_jenis,
          nama_jenis: initial.nama_jenis,
          deskripsi: initial.deskripsi ?? '',
          is_wajib: initial.is_wajib,
          nominal_tetap: initial.nominal_tetap,
        }
      : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.kode_jenis.trim()) e.kode_jenis = 'Kode wajib diisi'
    else if (form.kode_jenis.length > 10) e.kode_jenis = 'Maksimal 10 karakter'
    if (!form.nama_jenis.trim()) e.nama_jenis = 'Nama wajib diisi'
    else if (form.nama_jenis.length > 50) e.nama_jenis = 'Maksimal 50 karakter'
    if (form.nominal_tetap < 0) e.nominal_tetap = 'Nominal tidak boleh negatif'
    if (form.is_wajib && form.nominal_tetap <= 0)
      e.nominal_tetap = 'Simpanan wajib harus memiliki nominal tetap > 0'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      const payload = {
        kode_jenis:    form.kode_jenis.trim().toUpperCase(),
        nama_jenis:    form.nama_jenis.trim(),
        deskripsi:     form.deskripsi.trim() || null,
        is_wajib:      form.is_wajib,
        nominal_tetap: form.nominal_tetap,
      }
      if (isEdit) {
        await api.put(`/simpanan/jenis/${initial.id_jenis_simpanan}`, payload)
        onSuccess(`Jenis simpanan "${payload.nama_jenis}" berhasil diperbarui`)
      } else {
        await api.post('/simpanan/jenis', payload)
        onSuccess(`Jenis simpanan "${payload.nama_jenis}" berhasil ditambahkan`)
      }
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Gagal menyimpan data'
      setErrors({ _global: msg })
    } finally { setLoading(false) }
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-ink-800 transition-colors bg-white ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-surface-300'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-800">
                {isEdit ? 'Edit Jenis Simpanan' : 'Tambah Jenis Simpanan'}
              </h2>
              <p className="text-[11px] text-ink-400 mt-0.5">
                {isEdit ? `Mengedit: ${initial.nama_jenis}` : 'Definisikan jenis simpanan baru'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{errors._global}</p>
            </div>
          )}

          {/* Kode & Nama */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Kode Jenis <span className="text-red-500">*</span>
              </label>
              <input
                value={form.kode_jenis}
                onChange={e => set('kode_jenis', e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="mis. POKOK"
                className={inputCls('kode_jenis') + ' uppercase font-mono'}
              />
              {errors.kode_jenis && <p className="text-[10px] text-red-500 mt-1">{errors.kode_jenis}</p>}
              <p className="text-[10px] text-ink-300 mt-1">Maks. 10 karakter, unik</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Nama Jenis <span className="text-red-500">*</span>
              </label>
              <input
                value={form.nama_jenis}
                onChange={e => set('nama_jenis', e.target.value)}
                maxLength={50}
                placeholder="mis. Simpanan Pokok"
                className={inputCls('nama_jenis')}
              />
              {errors.nama_jenis && <p className="text-[10px] text-red-500 mt-1">{errors.nama_jenis}</p>}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Keterangan / Deskripsi</label>
            <textarea
              value={form.deskripsi}
              onChange={e => set('deskripsi', e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat tentang jenis simpanan ini…"
              className={inputCls('deskripsi') + ' resize-none'}
            />
          </div>

          {/* Wajib toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-surface-200 bg-surface-50">
            <div>
              <p className="text-xs font-semibold text-ink-700">Simpanan Wajib</p>
              <p className="text-[11px] text-ink-400 mt-0.5">
                Jika aktif, setiap anggota wajib membayar nominal ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('is_wajib', !form.is_wajib)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_wajib ? 'bg-accent-600' : 'bg-surface-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_wajib ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Nominal Tetap */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              Nominal Tetap
              {form.is_wajib && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 font-medium">Rp</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.nominal_tetap}
                onChange={e => set('nominal_tetap', Math.max(0, Number(e.target.value)))}
                className={inputCls('nominal_tetap') + ' pl-9'}
              />
            </div>
            {errors.nominal_tetap && <p className="text-[10px] text-red-500 mt-1">{errors.nominal_tetap}</p>}
            <p className="text-[10px] text-ink-300 mt-1">
              {form.is_wajib
                ? 'Nominal wajib dibayar setiap periode'
                : 'Isi 0 jika nominal bebas (sukarela)'}
            </p>
          </div>

          {/* Preview */}
          {(form.kode_jenis || form.nama_jenis) && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-accent-50 border border-accent-200">
              <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-accent-800">
                  {form.nama_jenis || '—'}
                  {form.is_wajib && <span className="ml-2 text-[10px] font-semibold bg-accent-200 text-accent-700 px-1.5 py-0.5 rounded-full">WAJIB</span>}
                </p>
                <p className="text-[11px] text-accent-600 mt-0.5">
                  {form.kode_jenis || '—'} ·{' '}
                  {form.nominal_tetap > 0 ? fmt(form.nominal_tetap) + '/periode' : 'Nominal bebas'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-surface-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 border border-surface-300 hover:bg-surface-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Jenis'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function JenisSimpananPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [list, setList]       = useState<JenisSimpanan[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<ToastData | null>(null)

  // Modal states
  const [showForm, setShowForm]       = useState(false)
  const [editTarget, setEditTarget]   = useState<JenisSimpanan | null>(null)
  const [confirmDel, setConfirmDel]   = useState<JenisSimpanan | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<JenisSimpanan | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => setToast({ type, message: msg })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Tanpa filter → tampilkan semua (aktif & nonaktif) untuk halaman admin
      const data = await api.get<JenisSimpanan[]>('/simpanan/jenis')
      setList(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Gagal memuat data jenis simpanan')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Hapus ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) return
    setActionLoading(true)
    try {
      const res = await api.delete<{ message: string }>(`/simpanan/jenis/${confirmDel.id_jenis_simpanan}`)
      showToast('success', res.message ?? `Jenis simpanan "${confirmDel.nama_jenis}" dihapus`)
      setConfirmDel(null)
      load()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail ?? 'Gagal menghapus')
    } finally { setActionLoading(false) }
  }

  // ── Toggle aktif / nonaktif ───────────────────────────────────────────────
  const handleToggle = async () => {
    if (!confirmToggle) return
    setActionLoading(true)
    try {
      await api.patch(`/simpanan/jenis/${confirmToggle.id_jenis_simpanan}/toggle`)
      const label = confirmToggle.is_active ? 'dinonaktifkan' : 'diaktifkan'
      showToast('success', `Jenis simpanan "${confirmToggle.nama_jenis}" berhasil ${label}`)
      setConfirmToggle(null)
      load()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail ?? 'Gagal mengubah status')
    } finally { setActionLoading(false) }
  }

  // ── Statistik ─────────────────────────────────────────────────────────────
  const totalAktif  = list.filter(j => j.is_active).length
  const totalWajib  = list.filter(j => j.is_wajib && j.is_active).length
  const totalSukarela = list.filter(j => !j.is_wajib && j.is_active).length

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modals */}
      {(showForm || editTarget) && (
        <ModalForm
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSuccess={msg => { showToast('success', msg); load() }}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title="Hapus Jenis Simpanan"
          message={`Yakin ingin menghapus "${confirmDel.nama_jenis}"? Jika sudah ada transaksi, jenis ini hanya akan dinonaktifkan.`}
          confirmLabel="Hapus"
          confirmCls="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
          loading={actionLoading}
        />
      )}
      {confirmToggle && (
        <ConfirmDialog
          title={confirmToggle.is_active ? 'Nonaktifkan Jenis Simpanan' : 'Aktifkan Jenis Simpanan'}
          message={
            confirmToggle.is_active
              ? `Menonaktifkan "${confirmToggle.nama_jenis}" akan menyembunyikannya dari dropdown transaksi. Lanjutkan?`
              : `Mengaktifkan "${confirmToggle.nama_jenis}" akan menampilkannya kembali di dropdown transaksi. Lanjutkan?`
          }
          confirmLabel={confirmToggle.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          confirmCls={confirmToggle.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}
          onConfirm={handleToggle}
          onCancel={() => setConfirmToggle(null)}
          loading={actionLoading}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Jenis Simpanan</h1>
          <p className="text-xs text-ink-400 mt-0.5">
            {isAdmin
              ? 'Kelola jenis simpanan — Pokok, Wajib, Sukarela, dan lainnya'
              : 'Daftar jenis simpanan yang tersedia dalam sistem'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shrink-0 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            <Plus className="w-4 h-4" /> Tambah Jenis
          </button>
        )}
      </div>

    
      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Aktif',    val: totalAktif,    icon: CheckCircle2,  bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Wajib',          val: totalWajib,    icon: BadgeCheck,    bg: 'bg-blue-50',    color: 'text-blue-600'    },
          { label: 'Sukarela',       val: totalSukarela, icon: Wallet,        bg: 'bg-purple-50',  color: 'text-purple-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800">{loading ? '—' : s.val}</p>
              <p className="text-xs text-ink-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabel ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        {/* Header tabel */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ink-800/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-ink-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Daftar Jenis Simpanan</h2>
              <p className="text-[11px] text-ink-400">{list.length} jenis terdaftar</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-surface-300 text-ink-500 hover:bg-surface-100 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Kode</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Nama Simpanan</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Keterangan</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Nominal</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Tipe</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="w-7 h-7 rounded-lg" />
                          <Skeleton className="w-7 h-7 rounded-lg" />
                          <Skeleton className="w-7 h-7 rounded-lg" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 text-ink-300" />
            </div>
            <p className="text-sm font-medium text-ink-500">Belum ada jenis simpanan</p>
            {isAdmin && (
              <button
                onClick={() => { setEditTarget(null); setShowForm(true) }}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah sekarang
              </button>
            )}
          </div>
        )}

        {/* Tabel Data */}
        {!loading && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Kode</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Nama Simpanan</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Keterangan</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Nominal</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Tipe</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Status</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {list.map(j => (
                  <tr
                    key={j.id_jenis_simpanan}
                    className={`hover:bg-surface-50/60 transition-colors ${!j.is_active ? 'opacity-50' : ''}`}
                  >
                    {/* Kode */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-ink-100 text-ink-700 text-[10px] font-bold font-mono tracking-wide">
                        {j.kode_jenis}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink-800">{j.nama_jenis}</p>
                    </td>

                    {/* Keterangan */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="text-ink-500 truncate">{j.deskripsi || <span className="text-ink-300">—</span>}</p>
                    </td>

                    {/* Nominal */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {j.nominal_tetap > 0 ? (
                        <span className="font-semibold text-ink-800">{fmt(j.nominal_tetap)}</span>
                      ) : (
                        <span className="text-ink-300 text-[11px]">Bebas</span>
                      )}
                    </td>

                    {/* Tipe: Wajib / Sukarela */}
                    <td className="px-4 py-3.5">
                      {j.is_wajib ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          <BadgeCheck className="w-3 h-3" /> Wajib
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                          <Wallet className="w-3 h-3" /> Sukarela
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {j.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-100 text-ink-400 ring-1 ring-surface-300">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Aksi — hanya admin */}
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => setEditTarget(j)}
                            title="Edit"
                            className="p-1.5 rounded-lg border border-surface-300 text-ink-500 hover:bg-surface-100 hover:text-ink-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle aktif/nonaktif */}
                          <button
                            onClick={() => setConfirmToggle(j)}
                            title={j.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              j.is_active
                                ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {j.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => setConfirmDel(j)}
                            title="Hapus"
                            className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors "
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info footer */}
        {!loading && list.length > 0 && (
          <div className="px-5 py-3 border-t border-surface-100 bg-surface-50">
            <p className="text-[11px] text-ink-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Jenis simpanan yang <strong>Aktif</strong> akan muncul sebagai pilihan di dropdown transaksi simpanan.
              Jenis yang sudah digunakan dalam transaksi hanya bisa dinonaktifkan, bukan dihapus permanen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}