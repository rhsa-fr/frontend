'use client'

import { Download, FileText, Sheet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { api } from '@/lib/axios'

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

interface ExportButtonsProps {
  data: any[]
  filename: string
  sheetName?: string
  columns?: { key: string; label: string }[]
  pdfTitle?: string
  pdfOrientation?: 'portrait' | 'landscape'
  disabled?: boolean
}

export default function ExportButtons({
  data,
  filename,
  sheetName = 'Data',
  columns,
  pdfTitle,
  pdfOrientation = 'landscape',
  disabled = false
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [setting, setSetting] = useState<Setting | null>(null)

  // Fetch setting
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const data = await api.get<Setting>('/setting')
        setSetting(data)
      } catch (err) {
        console.error('Gagal memuat setting:', err)
      }
    }
    fetchSetting()
  }, [])

  const handleExportExcel = async () => {
    try {
      setError(null)
      setExporting('excel')
      await exportToExcel(
        data, 
        filename, 
        sheetName, 
        columns?.map(c => c.key),
        setting ? {
          nama_koperasi: setting.nama_koperasi,
          alamat: setting.alamat,
          no_telepon: setting.no_telepon,
          email: setting.email
        } : undefined
      )
      setExporting(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengekspor ke Excel'
      setError(message)
      setExporting(null)
    }
  }

  const handleExportPDF = async () => {
    try {
      setError(null)
      setExporting('pdf')
      if (columns) {
        await exportToPDF(
          data, 
          filename, 
          columns, 
          {
            title: pdfTitle,
            orientation: pdfOrientation
          },
          setting ? {
            nama_koperasi: setting.nama_koperasi,
            alamat: setting.alamat,
            no_telepon: setting.no_telepon,
            email: setting.email
          } : undefined
        )
      }
      setExporting(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengekspor ke PDF'
      setError(message)
      setExporting(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportExcel}
          disabled={disabled || data.length === 0 || exporting !== null}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'transition-all duration-150 border border-emerald-200',
            !disabled && data.length > 0
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'opacity-50 cursor-not-allowed'
          )}
          title="Ekspor ke Excel"
        >
          <Sheet className="w-4 h-4" />
          {exporting === 'excel' ? 'Mengekspor...' : 'Excel'}
        </button>

        <button
          onClick={handleExportPDF}
          disabled={disabled || data.length === 0 || !columns || exporting !== null}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'transition-all duration-150 border border-red-200',
            !disabled && data.length > 0 && columns
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'opacity-50 cursor-not-allowed'
          )}
          title="Ekspor ke PDF"
        >
          <FileText className="w-4 h-4" />
          {exporting === 'pdf' ? 'Mengekspor...' : 'PDF'}
        </button>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setError(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-800">Gagal Mengekspor</h3>
                <p className="text-xs text-ink-400 mt-0.5">Terjadi kesalahan saat mengekspor data</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-ink-400" />
              </button>
            </div>
            <p className="text-sm text-ink-600 mb-5 bg-red-50 rounded-lg p-3 border border-red-100">
              {error}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setError(null)}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
