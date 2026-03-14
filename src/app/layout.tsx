import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Kopdar — Koperasi Simpan Pinjam',
    template: '%s | Kopdar',
  },
  description: 'Sistem manajemen koperasi simpan pinjam',
  icons: {
    icon: '/logo-kopdar.svg',
    shortcut: '/logo-kopdar.svg',
    apple: '/logo-kopdar.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}