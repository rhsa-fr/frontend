'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, RefreshCw, Plus, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle,
  CreditCard, CheckCheck, Search
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import ModalVerifikasi from './ModalVerifikasi'
import FormPinjaman from './FormPinjaman'
import { Pinjaman, formatRupiah } from './types'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'

// ============================================================================
// Types lokal (untuk PaginatedResponse)
// ============================================================================

interface PaginatedResponse {
  data: Pinjaman[]
  meta: { total: number; page: number; total_pages: number; skip: number; limit: number }
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  menunggu:  { label: 'Menunggu',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock        },
  pending:   { label: 'Menunggu',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock        },
  disetujui: { label: 'Disetujui', color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle2 },
  ditolak:   { label: 'Ditolak',   color: 'text-red-500',     bg: 'bg-red-50',     icon: XCircle      },
  lunas:     { label: 'Lunas',     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCheck   },
} as const

// ============================================================================
// Avatar
// ============================================================================

function Avatar() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
      <User className="w-4 h-4 text-white" />
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function PinjamanPage() {
  const [data, setData] = useState<Pinjaman[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [counts, setCounts] = useState({ semua: 0, pending: 0, disetujui: 0, ditolak: 0, lunas: 0 })

  // Modal states
  const [showFormPinjaman, setShowFormPinjaman] = useState(false)
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)

  // ✅ Role-based permissions
  const { user } = useAuth()
  const canBuat       = user?.role === 'admin' || user?.role === 'bendahara'
  const canVerifikasi = user?.role === 'ketua'

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * LIMIT),
        limit: String(LIMIT),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const res = await api.get<PaginatedResponse>(`/pinjaman?${params}`)
      setData(res.data)
      setMeta({ total: res.meta.total, page: res.meta.page, total_pages: res.meta.total_pages })

      try {
        const [all, pending, disetujui, ditolak, lunas] = await Promise.all([
          api.get<PaginatedResponse>('/pinjaman?limit=1'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=pending'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=disetujui'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=ditolak'),
          api.get<PaginatedResponse>('/pinjaman?limit=1&status=lunas'),
        ])
        setCounts({
          semua: all.meta.total,
          pending: pending.meta.total,
          disetujui: disetujui.meta.total,
          ditolak: ditolak.meta.total,
          lunas: lunas.meta.total,
        })
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  // Saat verifikasi berhasil — update data di tabel langsung tanpa refetch
  const handleVerifikasiSuccess = (updated: Pinjaman) => {
    setData(prev => prev.map(p => p.id_pinjaman === updated.id_pinjaman ? updated : p))
    setSelectedPinjaman(null)
    const statusLabel = updated.status === 'disetujui' ? 'disetujui' : 'ditolak'
    setToast({ type: updated.status === 'disetujui' ? 'success' : 'error', message: `Pinjaman ${updated.no_pinjaman} berhasil ${statusLabel}` })
    fetchData() // refresh counts
  }

  const STAT_CARDS = [
    { label: 'Total Pinjaman', count: counts.semua,     iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
    { label: 'Menunggu',       count: counts.pending,   iconBg: 'bg-amber-50',   iconColor: 'text-amber-500'   },
    { label: 'Disetujui',      count: counts.disetujui, iconBg: 'bg-blue-50',    iconColor: 'text-blue-500'    },
    { label: 'Lunas',          count: counts.lunas,     iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  ]

  const FILTER_PILLS = [
    { value: '',          label: 'Semua'       },
    { value: 'pending',   label: '● Menunggu'  },
    { value: 'disetujui', label: '● Disetujui' },
    { value: 'ditolak',   label: '● Ditolak'   },
    { value: 'lunas',     label: '● Lunas'     },
  ]

  return (
    <div className="space-y-4">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-ink-800">Manajemen Pinjaman</h2>
          <p className="text-xs text-ink-300">Kelola seluruh data pinjaman koperasi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all"
            title="Refresh">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {/* ✅ Hanya admin & bendahara yang bisa buat pengajuan */}
          {canBuat && (
            <button
              onClick={() => setShowFormPinjaman(true)}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Ajukan Pinjaman
            </button>
          )}
        </div>
      </div>

      {/* ── Rekap Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-surface-300 shadow-card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
              <CreditCard className={cn('w-5 h-5', card.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800 leading-none">{card.count}</p>
              <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_PILLS.map(pill => (
            <button key={pill.value}
              onClick={() => { setStatusFilter(pill.value); setPage(1) }}
              className={cn(
                'h-8 px-3.5 rounded-full text-xs font-semibold transition-all border',
                statusFilter === pill.value
                  ? 'bg-ink-800 text-white border-ink-800'
                  : 'bg-white border-surface-300 text-ink-600 hover:border-ink-300 hover:bg-surface-50'
              )}>
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama anggota atau no. pinjaman..."
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-surface-300 text-xs text-ink-800 outline-none focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5] bg-white transition-all placeholder:text-ink-200"
          />
        </div>
      </div>

      {/* ── Hint untuk ketua ── */}
      {canVerifikasi && !canBuat && counts.pending > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            Ada <strong>{counts.pending} pengajuan</strong> yang menunggu keputusan Anda.
            Klik baris pinjaman untuk memberi keputusan.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-surface-300 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {[
                'NO. PINJAMAN', 'ANGGOTA', 'NOMINAL / SISA',
                'ANGSURAN/BLN', 'PENGAJUAN', 'STATUS',
                ...(canVerifikasi ? ['KEPUTUSAN'] : [])
              ].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-ink-300 tracking-widest uppercase px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(LIMIT).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-surface-100">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-2 w-16" />
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  {canVerifikasi && <td className="px-4 py-3"><Skeleton className="h-8 w-20 rounded-xl" /></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={canVerifikasi ? 7 : 6} className="text-center py-16">
                  <CreditCard className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-300">Belum ada data pinjaman</p>
                </td>
              </tr>
            ) : (
              data.map((p, idx) => {
                const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                const StIcon = st.icon
                const persen = p.total_pinjaman > 0
                  ? Math.round(((p.total_pinjaman - p.sisa_pinjaman) / p.total_pinjaman) * 100)
                  : 0
                const isPending = p.status === 'pending'

                return (
                  <tr key={p.id_pinjaman}
                    className={cn(
                      'border-b border-surface-100 transition-colors',
                      idx === data.length - 1 && 'border-b-0',
                      canVerifikasi && isPending
                        ? 'hover:bg-amber-50 cursor-pointer'
                        : 'hover:bg-surface-50'
                    )}
                    onClick={() => {
                      // Ketua bisa klik baris pending untuk verifikasi
                      if (canVerifikasi && isPending) setSelectedPinjaman(p)
                    }}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-ink-400 whitespace-nowrap">{p.no_pinjaman}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar />
                        <p className="text-sm font-semibold text-ink-800 whitespace-nowrap">{p.nama_anggota ?? '—'}</p>
                      </div>
                    </td>
                    {/* NOMINAL / SISA — digabung */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-ink-800 whitespace-nowrap">{formatRupiah(p.nominal_pinjaman)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-ink-500">{formatRupiah(p.sisa_pinjaman)}</p>
                        {p.status === 'disetujui' && (
                          <>
                            <div className="w-12 h-1 bg-surface-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${persen}%` }} />
                            </div>
                            <span className="text-[10px] text-ink-300">{persen}%</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatRupiah(p.nominal_angsuran)}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{p.tanggal_pengajuan}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', st.bg, st.color)}>
                        <StIcon className="w-3 h-3" />{st.label}
                      </span>
                    </td>
                    {/* ✅ Kolom keputusan hanya untuk ketua */}
                    {canVerifikasi && (
                      <td className="px-4 py-3">
                        {isPending ? (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedPinjaman(p) }}
                            className="h-8 px-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <span className="text-xs text-ink-200">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Pagination ── */}
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

      {/* ── Modal Form Pengajuan (admin & bendahara) ── */}
      {showFormPinjaman && (
        <FormPinjaman
          onClose={() => setShowFormPinjaman(false)}
          onSuccess={(result) => {
            setShowFormPinjaman(false)
            setToast({ type: 'success', message: `Pengajuan pinjaman ${result.no_pinjaman} berhasil diajukan` })
            fetchData()
          }}
        />
      )}

      {/* ── Modal Verifikasi (ketua & admin) ── */}
      {selectedPinjaman && (
        <ModalVerifikasi
          pinjaman={selectedPinjaman}
          onClose={() => setSelectedPinjaman(null)}
          onSuccess={handleVerifikasiSuccess}
        />
      )}
    </div>
  )
}