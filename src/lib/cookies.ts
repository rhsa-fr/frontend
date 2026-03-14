/**
 * Sets a SESSION cookie so Next.js middleware can read the token server-side.
 *
 * Sengaja TIDAK memakai max-age / expires agar cookie otomatis hilang
 * ketika browser ditutup (session cookie behavior).
 *
 * Next.js middleware berjalan di Edge runtime dan tidak bisa baca
 * localStorage, sehingga token di-mirror ke cookie untuk proteksi route.
 */
export function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return
  // Tanpa max-age → session cookie → hilang saat browser ditutup
  document.cookie = `koperasi_token=${token}; path=/; SameSite=Strict`
}

export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = 'koperasi_token=; path=/; max-age=0'
}