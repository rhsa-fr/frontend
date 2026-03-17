/**
 * Export utility functions for Excel and PDF
 * Dependencies required:
 * xlsx, jspdf, jspdf-autotable
 */

interface Setting {
  nama_koperasi?: string
  alamat?: string
  no_telepon?: string
  email?: string
}

// Export to Excel (client-side using XLSX)
export const exportToExcel = async (
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1',
  columns?: string[],
  setting?: Setting
) => {
  try {
    // Load XLSX from CDN as fallback
    if (!(window as any).XLSX) {
      // Try loading from npm first (installed version)
      try {
        const module = await (require as any).ensure(['xlsx'], (require: any) => {
          return require('xlsx')
        })
      } catch (e) {
        // Load from CDN if npm fails
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
        script.async = true
        
        return new Promise((resolve, reject) => {
          script.onload = () => {
            doExportExcel(data, filename, sheetName, columns, setting)
            resolve(true)
          }
          script.onerror = () => {
            reject(new Error('Gagal memuat library Excel. Periksa koneksi internet.'))
          }
          document.body.appendChild(script)
        })
      }
    }

    doExportExcel(data, filename, sheetName, columns, setting)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengekspor ke Excel'
    console.error('Export to Excel error:', error)
    throw new Error(message)
  }
}

// Helper function to do the actual Excel export
const doExportExcel = (
  data: any[],
  filename: string,
  sheetName: string,
  columns?: string[],
  setting?: Setting
) => {
  const XLSX = (window as any).XLSX

  if (!XLSX) {
    throw new Error('Library xlsx tidak tersedia')
  }

  // Process data
  let processedData = data
  if (columns) {
    processedData = data.map(row => {
      const obj: any = {}
      columns.forEach(col => {
        obj[col] = row[col]
      })
      return obj
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(processedData)
  
  // Add header info if setting provided
  if (setting?.nama_koperasi) {
    // Create new worksheet with header
    const headerData = [
      [setting.nama_koperasi],
      [setting.alamat || ''],
      [setting.no_telepon || ''],
      [setting.email || ''],
      [],
      ...processedData
    ]
    const worksheet2 = XLSX.utils.json_to_sheet(headerData)
    XLSX.utils.sheet_add_json(worksheet2, processedData, { origin: 'A6' })
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet2, sheetName)

    // Auto-fit columns
    const maxWidth = 50
    const columnWidths = Object.keys(processedData[0] || {}).map(() => ({
      wch: Math.min(maxWidth, 20)
    }))
    worksheet2['!cols'] = columnWidths

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  } else {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Auto-fit columns
    const maxWidth = 50
    const columnWidths = Object.keys(processedData[0] || {}).map((key: string) => ({
      wch: Math.min(maxWidth, Math.max(10, key.length + 2))
    }))
    worksheet['!cols'] = columnWidths

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }
}

// Export to PDF
export const exportToPDF = async (
  data: any[],
  filename: string,
  columns: { key: string; label: string }[],
  options?: {
    title?: string
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'a4' | 'letter'
  },
  setting?: Setting
) => {
  try {
    // Load jsPDF and autoTable from CDN
    if (!(window as any).jspdf || !(window as any).autoTable) {
      // Load jsPDF
      if (!(window as any).jspdf) {
        const jsPdfScript = document.createElement('script')
        jsPdfScript.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
        jsPdfScript.async = true
        
        await new Promise((resolve, reject) => {
          jsPdfScript.onload = () => resolve(true)
          jsPdfScript.onerror = () => reject(new Error('Gagal memuat jsPDF'))
          document.body.appendChild(jsPdfScript)
        })
      }

      // Load html2canvas (required by jsPDF)
      if (!(window as any).html2canvas) {
        const html2canvasScript = document.createElement('script')
        html2canvasScript.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
        html2canvasScript.async = true
        
        await new Promise((resolve) => {
          html2canvasScript.onload = () => resolve(true)
          document.body.appendChild(html2canvasScript)
        })
      }

      // Load autoTable
      if (!(window as any).autoTable) {
        const autoTableScript = document.createElement('script')
        autoTableScript.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js'
        autoTableScript.async = true
        
        await new Promise((resolve, reject) => {
          autoTableScript.onload = () => resolve(true)
          autoTableScript.onerror = () => reject(new Error('Gagal memuat autoTable'))
          document.body.appendChild(autoTableScript)
        })
      }
    }

    await doExportPDF(data, filename, columns, options, setting)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengekspor ke PDF'
    console.error('Export to PDF error:', error)
    throw new Error(message)
  }
}

// Load and convert logo SVG to canvas image data
const loadLogoAsDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch('/logo.svg')
    if (!response.ok) throw new Error('Logo not found')
    
    const svgText = await response.text()
    
    // Create SVG blob and object URL
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        try {
          // Draw SVG to canvas to get raster image
          const canvas = document.createElement('canvas')
          canvas.width = 200
          canvas.height = 200
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }
          
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          URL.revokeObjectURL(url)
          resolve(dataUrl)
        } catch (e) {
          console.warn('Failed to convert SVG to canvas:', e)
          resolve(null)
        }
      }
      img.onerror = () => {
        console.warn('Failed to load SVG image')
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  } catch (e) {
    console.warn('Failed to load logo:', e)
    return null
  }
}

// Helper function to do the actual PDF export
const doExportPDF = async (
  data: any[],
  filename: string,
  columns: { key: string; label: string }[],
  options?: {
    title?: string
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'a4' | 'letter'
  },
  setting?: Setting
) => {
  const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF

  if (!jsPDF) {
    throw new Error('Library jsPDF tidak tersedia')
  }

  const doc = new jsPDF({
    orientation: options?.orientation || 'landscape',
    unit: 'mm',
    format: options?.pageSize || 'a4'
  })

  let topMargin = 10
  let logoAdded = false

  // Add header with koperasi info
  if (setting?.nama_koperasi) {
    // Try to load logo
    const logoDataUrl = await loadLogoAsDataUrl()
    
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 10, 10, 10, 10)
        logoAdded = true
      } catch (e) {
        console.warn('Failed to add logo to PDF:', e)
      }
    }

    // Koperasi Info dengan background
    const leftOffset = logoAdded ? 25 : 10
    const rectWidth = doc.internal.pageSize.getWidth() - (logoAdded ? 35 : 20)
    doc.setFillColor(26, 47, 74)
    doc.rect(leftOffset, 10, rectWidth, 20, 'F')

    // Title
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(255, 255, 255)
    const titleX = logoAdded ? 30 : 15
    doc.text(setting.nama_koperasi, titleX, 17)

    // Reset color
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')

    // Sub info
    let subY = 33
    if (setting.alamat) {
      doc.text(`Alamat: ${setting.alamat}`, 10, subY)
      subY += 5
    }
    if (setting.no_telepon) {
      doc.text(`Telepon: ${setting.no_telepon}`, 10, subY)
      subY += 5
    }
    if (setting.email) {
      doc.text(`Email: ${setting.email}`, 10, subY)
      subY += 5
    }

    // Divider line
    doc.setLineWidth(0.5)
    doc.line(10, subY + 1, doc.internal.pageSize.getWidth() - 10, subY + 1)
    
    topMargin = subY + 6
  }

  // Title
  if (options?.title) {
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text(options.title, doc.internal.pageSize.getWidth() / 2, topMargin, {
      align: 'center'
    })
    topMargin += 10
  }

  // Prepare table data
  const headers = columns.map(col => col.label)
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key]
      if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
      if (value instanceof Date) return value.toLocaleDateString('id-ID')
      return value ?? '-'
    })
  )

  // Use autoTable with correct method (doc.autoTable instead of function call)
  // This is the non-deprecated way
  if (doc.autoTable) {
    doc.autoTable({
      margin: { top: topMargin },
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [26, 47, 74],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [240, 247, 255]
      },
      didDrawPage: (pageData: any) => {
        const pageCount = doc.internal.pages.length - 1
        const footerStr = `Halaman ${pageData.pageNumber} dari ${pageCount}`
        doc.setFontSize(10)
        doc.text(
          footerStr,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
    })
  } else {
    throw new Error('autoTable plugin tidak tersedia')
  }

  doc.save(`${filename}.pdf`)
}

// Format currency for export
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format date
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format status
export const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    aktif: 'Aktif',
    'non-aktif': 'Non-Aktif',
    keluar: 'Keluar',
    pending: 'Menunggu',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
    lunas: 'Lunas',
    dibayar: 'Dibayar',
    'belum_dibayar': 'Belum Dibayar',
    overdue: 'Terlambat'
  }
  return statusMap[status] || status
}
