import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login — Koperasi Simpan Pinjam',
  description: 'Masuk ke Sistem Manajemen Koperasi',
}

export default function LoginPage() {
  return <LoginForm />
}