'use client'

import type { Metadata } from 'next'
import { useState, useEffect, useCallback } from 'react'
import {
  User, Search, RefreshCw, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, X, Loader2
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
  email?: string
  no_telepon?: string
  tanggal_bergabung: string
  status: 'aktif' | 'non-aktif' | 'keluar'
  created_at: string
}

interface PaginatedResponse {
  data: Anggota[]
  meta: {
    total: number
    skip: number
    limit: number
    page: number
    total_pages: number
  }
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  aktif:      { label: 'Aktif',     color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'non-aktif':{ label: 'Non-Aktif', color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400'   },
  keluar:     { label: 'Keluar',    color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-400'     },
}

const EMPTY_FORM = {
  nama_lengkap: '',
  email: '',
  no_telepon: '',
  tanggal_bergabung: new Date().toISOString().slice(0, 10),
  status: 'aktif' as Anggota['status'],
}

// ============================================================================
// Avatar Anggota (siluet orang)
// ============================================================================

function AnggotaAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: { wrap: 'w-8 h-8 rounded-lg',    icon: 'w-4 h-4' },
    md: { wrap: 'w-10 h-10 rounded-xl',  icon: 'w-5 h-5' },
    lg: { wrap: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
  }[size]

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
// StatusBadge
// ============================================================================

function StatusBadge({ status }: { status: Anggota['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['non-aktif']
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ============================================================================
// Modal Tambah / Edit Anggota
// ============================================================================

interface ModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: Anggota | null
}

function AnggotaModal({ open, onClose, onSaved, editData }: ModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editData) {
      setForm({
        nama_lengkap: editData.nama_lengkap,
        email: editData.email ?? '',
        no_telepon: editData.no_telepon ?? '',
        tanggal_bergabung: editData.tanggal_bergabung,
        status: editData.status,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [editData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        nama_lengkap: form.nama_lengkap.trim(),
        email: form.email.trim() || null,
        no_telepon: form.no_telepon.trim() || null,
        tanggal_bergabung: form.tanggal_bergabung,
        ...(editData ? { status: form.status } : {}),
      }
      if (editData) {
        await api.put(`/anggota/${editData.id_anggota}`, payload)
      } else {
        await api.post('/anggota', payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <AnggotaAvatar size="sm" />
            <h2 className="text-sm font-bold text-ink-800">
              {editData ? 'Edit Anggota' : 'Tambah Anggota Baru'}
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.nama_lengkap}
              onChange={e => setForm(f => ({ ...f, nama_lengkap: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                         outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                         placeholder:text-ink-200 bg-surface-50 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="contoh@email.com"
              className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                         outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                         placeholder:text-ink-200 bg-surface-50 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">No. Telepon</label>
              <input
                value={form.no_telepon}
                onChange={e => setForm(f => ({ ...f, no_telepon: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           placeholder:text-ink-200 bg-surface-50 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">
                Tgl. Bergabung <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="date"
                value={form.tanggal_bergabung}
                onChange={e => setForm(f => ({ ...f, tanggal_bergabung: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           bg-surface-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {editData && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Anggota['status'] }))}
                className="w-full h-10 px-3 rounded-lg border border-surface-300 text-sm text-ink-800
                           outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                           bg-surface-50 focus:bg-white transition-all"
              >
                <option value="aktif">Aktif</option>
                <option value="non-aktif">Non-Aktif</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-surface-300 text-sm font-medium text-ink-600
                         hover:bg-surface-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2
                         transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function AnggotaPage() {
  const [data, setData] = useState<Anggota[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'aktif' | 'non-aktif' | 'keluar'>('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Anggota | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Anggota | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState({ semua: 0, aktif: 0, 'non-aktif': 0, keluar: 0 })

  // ✅ Cek role — hanya admin yang bisa tambah/edit/hapus
  const { user } = useAuth()
  const canEdit = user?.role === 'admin'

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * LIMIT),
        limit: String(LIMIT),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      const res = await api.get<PaginatedResponse>(`/anggota?${params}`)
      setData(res.data)
      setMeta({ total: res.meta.total, page: res.meta.page, total_pages: res.meta.total_pages })
      try {
        const [all, aktif, nonAktif, keluar] = await Promise.all([
          api.get<PaginatedResponse>('/anggota?limit=1'),
          api.get<PaginatedResponse>('/anggota?limit=1&status=aktif'),
          api.get<PaginatedResponse>('/anggota?limit=1&status=non-aktif'),
          api.get<PaginatedResponse>('/anggota?limit=1&status=keluar'),
        ])
        setCounts({
          semua: all.meta.total,
          aktif: aktif.meta.total,
          'non-aktif': nonAktif.meta.total,
          keluar: keluar.meta.total,
        })
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      await api.delete(`/anggota/${deleteConfirm.id_anggota}`)
      setDeleteConfirm(null)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari nama, no. anggota..."
              className="w-64 h-9 pl-9 pr-3 rounded-full border border-surface-300 text-sm text-ink-800
                         outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]
                         placeholder:text-ink-200 bg-white transition-all"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-300 hidden sm:block">
            {meta.total} anggota
          </span>
          <button
            onClick={fetchData}
            className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center
                       text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {/* ✅ Hanya admin yang bisa tambah anggota */}
          {canEdit && (
            <button
              onClick={() => { setEditData(null); setModalOpen(true) }}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5
                         transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Anggota
            </button>
          )}
        </div>
      </div>

      {/* ── Rekap Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Total Anggota', count: counts.semua,        iconBg: 'bg-blue-50',    iconColor: 'text-blue-500',    textColor: 'text-ink-800' },
          { label: 'Aktif',         count: counts.aktif,        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', textColor: 'text-ink-800' },
          { label: 'Non-Aktif',     count: counts['non-aktif'], iconBg: 'bg-amber-50',   iconColor: 'text-amber-500',   textColor: 'text-ink-800' },
          { label: 'Keluar',        count: counts.keluar,       iconBg: 'bg-red-50',     iconColor: 'text-red-400',     textColor: 'text-ink-800' },
        ]).map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-surface-300 shadow-card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
              <svg className={cn('w-5 h-5', card.iconColor)} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className={cn('text-2xl font-bold leading-none', card.textColor)}>{card.count}</p>
              <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Pill Status ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {([
          { value: '' as const,          label: 'Semua',       activeClass: 'bg-ink-800 text-white border-ink-800',         inactiveClass: 'text-ink-600'     },
          { value: 'aktif' as const,     label: '● Aktif',     activeClass: 'bg-emerald-500 text-white border-emerald-500', inactiveClass: 'text-emerald-600' },
          { value: 'non-aktif' as const, label: '● Non-Aktif', activeClass: 'bg-amber-500 text-white border-amber-500',     inactiveClass: 'text-amber-600'   },
          { value: 'keluar' as const,    label: '● Keluar',    activeClass: 'bg-red-500 text-white border-red-500',         inactiveClass: 'text-red-500'     },
        ]).map(pill => (
          <button
            key={pill.value}
            onClick={() => { setStatusFilter(pill.value); setPage(1) }}
            className={cn(
              'h-8 px-3.5 rounded-full text-xs font-semibold transition-all border',
              statusFilter === pill.value
                ? pill.activeClass
                : 'bg-white border-surface-300 hover:border-ink-300 hover:bg-surface-50 ' + pill.inactiveClass
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
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
              {/* ✅ Kolom AKSI hanya tampil jika admin */}
              {['NO. ANGGOTA', 'NAMA LENGKAP', 'EMAIL', 'NO. TELEPON', 'TGL. BERGABUNG', 'STATUS', ...(canEdit ? ['AKSI'] : [])].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-ink-300 tracking-widest uppercase px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="text-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-300 mx-auto mb-2" />
                  <p className="text-xs text-ink-300">Memuat data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="text-center py-16">
                  <User className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-300">
                    {search ? 'Tidak ada anggota yang cocok.' : 'Belum ada data anggota.'}
                  </p>
                </td>
              </tr>
            ) : (
              data.map((a, idx) => (
                <tr
                  key={a.id_anggota}
                  className={cn(
                    'border-b border-surface-100 hover:bg-surface-50 transition-colors',
                    idx === data.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-3 text-xs font-mono text-ink-400 whitespace-nowrap">{a.no_anggota}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AnggotaAvatar size="sm" />
                      <span className="font-semibold text-ink-800 whitespace-nowrap">{a.nama_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{a.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{a.no_telepon ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{a.tanggal_bergabung}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  {/* ✅ Tombol edit/hapus hanya untuk admin */}
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditData(a); setModalOpen(true) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300
                                     hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(a)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-300
                                     hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-300">
            Halaman {meta.page} dari {meta.total_pages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center
                         text-ink-400 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.total_pages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span key={`dots-${p}`} className="text-ink-300 text-xs px-1">…</span>
                  )}
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      p === page ? 'text-white shadow-sm' : 'border border-surface-300 text-ink-500 hover:bg-surface-100'
                    )}
                    style={p === page ? { background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' } : {}}
                  >
                    {p}
                  </button>
                </>
              ))}
            <button
              onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
              disabled={page === meta.total_pages}
              className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center
                         text-ink-400 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Tambah / Edit ── */}
      <AnggotaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
        editData={editData}
      />

      {/* ── Konfirmasi Hapus ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-800">Hapus Anggota</h3>
                <p className="text-xs text-ink-400">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Yakin ingin menghapus anggota <span className="font-semibold text-ink-800">{deleteConfirm.nama_lengkap}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-9 rounded-lg border border-surface-300 text-sm font-medium text-ink-600
                           hover:bg-surface-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}