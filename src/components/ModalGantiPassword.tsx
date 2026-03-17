'use client'

import { useState } from 'react'
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
}

export default function ModalGantiPassword({ onClose }: Props) {
  const [oldPassword,     setOldPassword]     = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld,         setShowOld]         = useState(false)
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [success,         setSuccess]         = useState(false)

  const inputCls = (hasError?: boolean) => cn(
    'w-full h-10 pl-9 pr-10 rounded-xl border text-sm text-ink-800 outline-none transition-all',
    'bg-surface-50 focus:bg-white placeholder:text-ink-200',
    'focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]',
    hasError ? 'border-red-300' : 'border-surface-300'
  )

  const handleSubmit = async () => {
    setError(null)
    if (!oldPassword)               { setError('Password lama wajib diisi'); return }
    if (!newPassword)               { setError('Password baru wajib diisi'); return }
    if (newPassword.length < 6)     { setError('Password baru minimal 6 karakter'); return }
    if (newPassword === oldPassword) { setError('Password baru tidak boleh sama dengan password lama'); return }
    if (newPassword !== confirmPassword) { setError('Konfirmasi password tidak cocok'); return }

    setLoading(true)
    try {
      await api.post('/users/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Gagal mengganti password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink-800">Ganti Password</h2>
              <p className="text-[11px] text-ink-400 mt-0.5">Perbarui password akun Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-800">Password Berhasil Diubah</p>
                <p className="text-xs text-ink-400 mt-1">Gunakan password baru saat login berikutnya</p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
                Selesai
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Password Lama */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Password Lama <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input type={showOld ? 'text' : 'password'} value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className={inputCls()} />
                  <button type="button" onClick={() => setShowOld(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Password Baru <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input type={showNew ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className={inputCls()} />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors',
                        newPassword.length >= i * 4
                          ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-surface-200'
                      )} />
                    ))}
                    <span className="text-[10px] text-ink-400 ml-1">
                      {newPassword.length < 4 ? 'Lemah' : newPassword.length < 8 ? 'Sedang' : 'Kuat'}
                    </span>
                  </div>
                )}
              </div>

              {/* Konfirmasi */}
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  Konfirmasi Password Baru <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className={inputCls(!!confirmPassword && confirmPassword !== newPassword)} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Password cocok
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-2 px-6 py-4 border-t border-surface-200">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                : 'Simpan Password'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}