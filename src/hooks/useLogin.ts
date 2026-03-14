'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LoginRequest } from '@/types/auth'

interface UseLoginReturn {
  username: string
  password: string
  showPassword: boolean
  isLoading: boolean
  error: string | null
  setUsername: (v: string) => void
  setPassword: (v: string) => void
  setShowPassword: (v: boolean) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export function useLogin(): UseLoginReturn {
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!username.trim()) {
        setError('Username tidak boleh kosong.')
        return
      }
      if (!password) {
        setError('Password tidak boleh kosong.')
        return
      }

      setIsLoading(true)
      try {
        const credentials: LoginRequest = { username: username.trim(), password }
        await login(credentials)
        // Redirect is handled inside AuthContext.login via router.push('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login gagal. Coba lagi.')
      } finally {
        setIsLoading(false)
      }
    },
    [login, username, password]
  )

  return {
    username,
    password,
    showPassword,
    isLoading,
    error,
    setUsername,
    setPassword,
    setShowPassword,
    handleSubmit,
  }
}
