// ============================================================================
// User & Auth Types
// ============================================================================

export type UserRole = 'admin' | 'ketua' | 'bendahara'

export interface User {
  id_user: number
  username: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Anggota Types
// ============================================================================

export interface Anggota {
  id_anggota: number
  no_anggota: string
  nama_lengkap: string
  email?: string
  no_telepon?: string
  tanggal_bergabung: string
  status: 'aktif' | 'non_aktif'
  created_at: string
  updated_at: string
}

export interface ProfilAnggota {
  id_profil: number
  id_anggota: number
  nik?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'L' | 'P'
  alamat?: string
  kota?: string
  provinsi?: string
  kode_pos?: string
  pekerjaan?: string
  foto_profil?: string
}

// ============================================================================
// Simpanan Types
// ============================================================================

export interface JenisSimpanan {
  id_jenis_simpanan: number
  kode_jenis: string
  nama_jenis: string
  deskripsi?: string
  is_wajib: boolean
  nominal_tetap: number
  is_active: boolean
}

export interface Simpanan {
  id_simpanan: number
  id_anggota: number
  nama_anggota?: string
  id_jenis_simpanan: number
  nama_jenis?: string
  no_simpanan: string
  saldo: number
  tanggal_buka: string
  status: 'aktif' | 'ditutup' | 'dibekukan'
  created_at: string
}

// ============================================================================
// Pinjaman Types
// ============================================================================

export type StatusPinjaman = 'menunggu' | 'disetujui' | 'ditolak' | 'lunas'

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
  created_at: string
}

// ============================================================================
// Angsuran Types
// ============================================================================

export type StatusAngsuran = 'belum_bayar' | 'lunas' | 'jatuh_tempo' | 'terlambat'

export interface Angsuran {
  id_angsuran: number
  id_pinjaman: number
  no_pinjaman?: string
  no_angsuran: string
  angsuran_ke: number
  tanggal_jatuh_tempo: string
  nominal_angsuran: number
  pokok: number
  bunga: number
  denda: number
  total_bayar: number
  tanggal_bayar?: string
  status: StatusAngsuran
  keterangan?: string
  created_at: string
}
