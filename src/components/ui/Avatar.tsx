// src/components/ui/Avatar.tsx
// Komponen avatar universal — gunakan ini di semua halaman yang ada avatar anggota

import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  sm:  { wrapper: 'w-7 h-7 rounded-lg',   icon: 'w-4 h-4' },
  md:  { wrapper: 'w-9 h-9 rounded-xl',   icon: 'w-5 h-5' },
  lg:  { wrapper: 'w-11 h-11 rounded-xl', icon: 'w-6 h-6' },
  xl:  { wrapper: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
}

export default function Avatar({ size = 'md', className }: AvatarProps) {
  const { wrapper, icon } = SIZE_MAP[size]

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        wrapper,
        className
      )}
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
    >
      <User className={cn(icon, 'text-white')} />
    </div>
  )
}