import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 p-4">
      <div className="text-center max-w-md">

        {/* Ilustrasi angka 404 */}
        <div className="relative mb-8 select-none">
          <p
            className="text-[120px] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </p>
          {/* Shadow dekoratif */}
          <p className="text-[120px] font-black leading-none tracking-tighter text-surface-200 absolute top-1 left-0 right-0 -z-10 select-none">
            404
          </p>
        </div>

        {/* Pesan */}
        <h1 className="text-xl font-bold text-ink-800 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-ink-400 mb-8 leading-relaxed">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
          Silakan kembali ke dashboard.
        </p>

        {/* Tombol */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
          >
            Ke Dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-ink-600 border border-surface-300 hover:bg-surface-200 transition-all"
          >
            Kembali
          </Link>
        </div>

      </div>
    </div>
  )
}