// ============================================================================
// Pinjaman Types — sesuai backend schema
// ============================================================================

export type StatusPinjaman = 'pending' | 'disetujui' | 'ditolak' | 'lunas' 

export interface Pinjaman {
  id_pinjaman: number
  id_anggota: number
  nama_anggota?: string
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  bunga_persen: number
  total_bunga: number
  total_pinjaman: number
  lama_angsuran: number
  nominal_angsuran: number
  keperluan?: string
  status: StatusPinjaman
  tanggal_persetujuan?: string
  tanggal_pencairan?: string
  tanggal_lunas?: string
  catatan_persetujuan?: string
  sisa_pinjaman: number
  total_syarat?: number
  syarat_terpenuhi?: number
  created_at: string
}

export interface PinjamanCreatePayload {
  id_anggota: number
  tanggal_pengajuan: string
  nominal_pinjaman: number
  bunga_persen: number
  lama_angsuran: number
  keperluan?: string
}

export interface PinjamanApprovePayload {
  tanggal_persetujuan: string
  tanggal_pencairan: string
  catatan_persetujuan?: string
}

export interface PinjamanRejectPayload {
  catatan_persetujuan: string
}

export interface Anggota {
  id_anggota: number
  no_anggota: string
  nama_lengkap: string
  status: string
}

// Syarat berdasarkan SQL seed data
export interface SyaratItem {
  kode: string
  nama: string
  deskripsi: string
  is_wajib: boolean
  min_nominal: number | null   // null = berlaku untuk semua nominal
  dokumen: string
}

export const SYARAT_LIST: SyaratItem[] = [
  { kode: 'SYR001', nama: 'Fotocopy KTP', deskripsi: 'Fotocopy KTP anggota yang masih berlaku', is_wajib: true, min_nominal: null, dokumen: 'KTP' },
  { kode: 'SYR002', nama: 'Fotocopy KK', deskripsi: 'Fotocopy Kartu Keluarga', is_wajib: true, min_nominal: null, dokumen: 'KK' },
  { kode: 'SYR005', nama: 'Surat Pernyataan', deskripsi: 'Surat pernyataan sanggup membayar angsuran', is_wajib: true, min_nominal: null, dokumen: 'Surat Pernyataan' },
  { kode: 'SYR006', nama: 'Pas Foto 4x6', deskripsi: 'Pas foto terbaru ukuran 4x6', is_wajib: false, min_nominal: null, dokumen: 'Pas Foto' },
  { kode: 'SYR003', nama: 'Slip Gaji', deskripsi: 'Slip gaji 3 bulan terakhir', is_wajib: true, min_nominal: 5_000_000, dokumen: 'Slip Gaji' },
  { kode: 'SYR004', nama: 'Jaminan BPKB', deskripsi: 'BPKB kendaraan sebagai jaminan', is_wajib: true, min_nominal: 10_000_000, dokumen: 'BPKB' },
  { kode: 'SYR007', nama: 'NPWP', deskripsi: 'Nomor Pokok Wajib Pajak', is_wajib: false, min_nominal: 20_000_000, dokumen: 'NPWP' },
  { kode: 'SYR008', nama: 'Sertifikat Rumah', deskripsi: 'Sertifikat rumah sebagai jaminan tambahan', is_wajib: false, min_nominal: 50_000_000, dokumen: 'Sertifikat' },
]

// Hitung syarat yang berlaku berdasarkan nominal
export function getSyaratByNominal(nominal: number): SyaratItem[] {
  return SYARAT_LIST.filter(
    (s) => s.min_nominal === null || nominal >= s.min_nominal
  )
}

// Kalkulasi pinjaman (mirror backend)
export function hitungPinjaman(
  nominal: number,
  bungaPersen: number,
  lamaAngsuran: number
) {
  const totalBunga = (nominal * bungaPersen * lamaAngsuran) / 100
  const totalPinjaman = nominal + totalBunga
  const nominalAngsuran = lamaAngsuran > 0 ? totalPinjaman / lamaAngsuran : 0
  return { totalBunga, totalPinjaman, nominalAngsuran }
}

export const STATUS_CONFIG: Record<StatusPinjaman, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: 'Menunggu',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  disetujui: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ditolak:   { label: 'Ditolak',   bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  lunas:     { label: 'Lunas',     bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}