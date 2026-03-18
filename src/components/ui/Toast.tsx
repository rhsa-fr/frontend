'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastData {
  type: 'success' | 'error'
  message: string
}

interface ToastProps extends ToastData {
  onClose: () => void
  autoDismiss?: number
}

export default function Toast({ type, message, onClose, autoDismiss = 3000 }: ToastProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const t = setTimeout(onClose, autoDismiss)
    return () => clearTimeout(t)
  }, [onClose, autoDismiss])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60]" />

      {/* Modal */}
      <div className="absolute inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-300">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
            )}>
              {type === 'success'
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                : <AlertCircle className="w-5 h-5 text-red-500" />
              }
            </div>
            <div>
              <h3 className={cn(
                'text-sm font-bold',
                type === 'success' ? 'text-emerald-800' : 'text-red-800'
              )}>
                {type === 'success' ? 'Berhasil' : 'Kesalahan'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {type === 'success' ? 'Aksi berhasil dilakukan' : 'Terjadi kesalahan'}
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-5">{message}</p>

          {/* OK Button */}
          <button
            onClick={onClose}
            className="w-full h-9 rounded-lg text-sm font-semibold transition-all text-white"
            style={{
              background: type === 'success'
                ? 'linear-gradient(135deg, #1a2f4a, #2a7fc5)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </>,
    document.getElementById('main-content') || document.body
  )
}
